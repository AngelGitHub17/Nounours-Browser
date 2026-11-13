#!/usr/bin/env python3
"""
Rebrande un moteur Firefox ESR officiel en « NounoursBrowser ».

Usage : tools/brand-engine.py <dossier-moteur> <linux|windows|macos>
  linux / windows : <dossier-moteur> contient firefox(.exe), browser/omni.ja …
  macos           : <dossier-moteur> est le bundle .app (Contents/…)

Ce qui change (le code du moteur n'est pas modifié) :
  - noms affichés : titres de fenêtre, menus, « À propos », paramètres…  (brand.ftl / brand.properties)
  - logos et icônes (À propos, onglets internes, icônes de fenêtre)
  - politiques : mises à jour Mozilla désactivées (le moteur est mis à jour par les releases
    NounoursBrowser, qui réappliquent ce rebranding), télémétrie coupée…
NounoursBrowser reste honnête sur son origine : la mention légale indique qu'il est basé sur Firefox.
"""
import glob
import os
import plistlib
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRANDING = os.path.join(ROOT, "branding")
NAME = "NounoursBrowser"
VENDOR = "NounoursCorp"

FTL = f"""# NounoursBrowser — marque (remplace la marque Firefox)
-brand-shorter-name = NounoursBrowser
-brand-short-name = {NAME}
-brand-shortcut-name = {NAME}
-brand-full-name = {NAME}
-brand-product-name = {NAME}
-vendor-short-name = {VENDOR}
trademarkInfo = {NAME} est basé sur Firefox ESR. Firefox et les logos Firefox sont des marques déposées de la Fondation Mozilla.
"""
FTL_EN = f"""-brand-shorter-name = NounoursBrowser
-brand-short-name = {NAME}
-brand-shortcut-name = {NAME}
-brand-full-name = {NAME}
-brand-product-name = {NAME}
-vendor-short-name = {VENDOR}
trademarkInfo = {NAME} is based on Firefox ESR. Firefox and the Firefox logos are trademarks of the Mozilla Foundation.
"""
PROPERTIES = f"""brandShorterName=NounoursBrowser
brandShortName={NAME}
brandFullName={NAME}
vendorShortName={VENDOR}
"""
WORDMARK = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 80">
  <text x="0" y="58" fill="context-fill" font-family="-apple-system, 'SF Pro Display', 'Segoe UI Variable Display', 'Segoe UI', Cantarell, sans-serif"
        font-size="56" font-weight="700" letter-spacing="-1">NounoursBrowser</text>
</svg>
"""


def run(*cmd, ok=(0,)):
    r = subprocess.run(cmd)
    if r.returncode not in ok:
        sys.exit(f"Échec : {' '.join(cmd)} (code {r.returncode})")


def png(size, dest):
    """Logos pré-rendus (branding/png) : aucun outil SVG requis sur les machines de build."""
    shutil.copy(os.path.join(BRANDING, "png", f"logo-{size}.png"), dest)


def patch_gre_omni(omni):
    """omni.ja « GRE » (toolkit) : illustrations de la mascotte Firefox → logo Nounours."""
    work = tempfile.mkdtemp()
    subprocess.run(["unzip", "-qq", "-o", omni, "-d", work], stderr=subprocess.DEVNULL)
    kits = glob.glob(os.path.join(work, "chrome", "toolkit", "skin", "classic", "global", "illustrations", "kit-*.svg"))
    for k in kits:
        shutil.copy(os.path.join(BRANDING, "logo.svg"), k)
    os.remove(omni)
    run("bash", "-c", f'cd "{work}" && zip -qr9XD "{os.path.abspath(omni)}" .')
    shutil.rmtree(work)
    print(f"  {os.path.relpath(omni)} : {len(kits)} illustrations remplacées")


def install_overlay(dest):
    """Fichiers ajoutés au moteur : autoconfig (section « NounoursBrowser » des Paramètres)."""
    src = os.path.join(ROOT, "engine-overlay")
    for base, _dirs, files in os.walk(src):
        rel = os.path.relpath(base, src)
        os.makedirs(os.path.join(dest, rel), exist_ok=True)
        for f in files:
            shutil.copy(os.path.join(base, f), os.path.join(dest, rel, f))


def patch_omni(omni):
    """omni.ja = zip au format « optimisé » de Mozilla : unzip le lit (avertissement → code 1/2),
    et Firefox relit sans souci un zip standard."""
    work = tempfile.mkdtemp()
    subprocess.run(["unzip", "-qq", "-o", omni, "-d", work], stderr=subprocess.DEVNULL)
    if not os.path.isdir(os.path.join(work, "chrome")) and not os.path.isdir(os.path.join(work, "localization")):
        sys.exit(f"Extraction impossible : {omni}")
    n = 0
    for f in glob.glob(os.path.join(work, "localization", "*", "branding", "brand.ftl")):
        with open(f, "w", encoding="utf-8") as fh:
            fh.write(FTL_EN if "/en-US/" in f.replace("\\", "/") else FTL)
        n += 1
    for f in glob.glob(os.path.join(work, "chrome", "*", "locale", "branding", "brand.properties")):
        with open(f, "w", encoding="utf-8") as fh:
            fh.write(PROPERTIES)
        n += 1
    content = os.path.join(work, "chrome", "browser", "content", "branding")
    if os.path.isdir(content):
        for s in (16, 32, 48, 64, 128):
            png(s, os.path.join(content, f"icon{s}.png"))
        for name, s in (("about-logo.png", 192), ("about-logo@2x.png", 384), ("about.png", 192),
                        ("about-logo-private.png", 192), ("about-logo-private@2x.png", 384)):
            png(s, os.path.join(content, name))
        shutil.copy(os.path.join(BRANDING, "logo.svg"), os.path.join(content, "about-logo.svg"))
        sidebar_icon = os.path.join(work, "chrome", "browser", "skin", "classic", "browser", "sidebar", "firefox.svg")
        if os.path.exists(sidebar_icon):
            shutil.copy(os.path.join(BRANDING, "logo.svg"), sidebar_icon)
        for w in ("about-wordmark.svg", "firefox-wordmark.svg"):
            with open(os.path.join(content, w), "w", encoding="utf-8") as fh:
                fh.write(WORDMARK)
        n += 1
    if n == 0:
        sys.exit(f"Aucun fichier de marque trouvé dans {omni}")
    os.remove(omni)
    run("bash", "-c", f'cd "{work}" && zip -qr9XD "{os.path.abspath(omni)}" .')
    shutil.rmtree(work)
    print(f"  {os.path.relpath(omni)} : marque remplacée ({n} éléments)")


def install_policies(dist_dir):
    os.makedirs(dist_dir, exist_ok=True)
    shutil.copy(os.path.join(ROOT, "distribution", "policies.json"), os.path.join(dist_dir, "policies.json"))


def window_icons(icons_dir, ico=False):
    os.makedirs(icons_dir, exist_ok=True)
    for s in (16, 32, 48, 64, 128):
        png(s, os.path.join(icons_dir, f"default{s}.png"))
    if ico:
        shutil.copy(os.path.join(BRANDING, "logo.ico"), os.path.join(icons_dir, "main-window.ico"))


def brand_unix_like(engine, windows):
    patch_omni(os.path.join(engine, "browser", "omni.ja"))
    patch_gre_omni(os.path.join(engine, "omni.ja"))
    install_overlay(engine)
    window_icons(os.path.join(engine, "browser", "chrome", "icons", "default"), ico=windows)
    install_policies(os.path.join(engine, "distribution"))
    # Tuiles du menu Démarrer (Windows)
    ve = os.path.join(engine, "browser", "VisualElements")
    if os.path.isdir(ve):
        for f in glob.glob(os.path.join(ve, "*.png")):
            m = re.search(r"_(\d+)\.png$", f)
            png(150 if not m or int(m.group(1)) > 100 else 70, f)
    for junk in ("crashreporter", "crashreporter.exe", "pingsender", "pingsender.exe",
                 "updater", "updater.exe", "maintenanceservice.exe", "maintenanceservice_installer.exe",
                 "default-browser-agent.exe", "uninstall", "confused_fox.pdf"):
        p = os.path.join(engine, junk)
        if os.path.isdir(p):
            shutil.rmtree(p)
        elif os.path.exists(p):
            os.remove(p)


def brand_macos(app):
    res = os.path.join(app, "Contents", "Resources")
    patch_omni(os.path.join(res, "browser", "omni.ja"))
    patch_gre_omni(os.path.join(res, "omni.ja"))
    install_overlay(res)
    install_policies(os.path.join(res, "distribution"))
    # Icône de l'appli : macOS récent la prend dans Assets.car (clé CFBundleIconName) avant le .icns ;
    # on retire cette clé et on pointe CFBundleIconFile sur notre icône.
    shutil.copy(os.path.join(BRANDING, "logo.icns"), os.path.join(res, "nounoursbrowser.icns"))
    for icns in glob.glob(os.path.join(res, "firefox.icns")):
        shutil.copy(os.path.join(BRANDING, "logo.icns"), icns)
    # Nom de l'appli (barre des menus, Dock) et identifiant propre
    info = os.path.join(app, "Contents", "Info.plist")
    with open(info, "rb") as fh:
        pl = plistlib.load(fh)
    pl["CFBundleName"] = NAME
    pl["CFBundleDisplayName"] = NAME
    pl["CFBundleIdentifier"] = "fr.nounourscorp.browser"
    pl["CFBundleGetInfoString"] = NAME
    pl["CFBundleIconFile"] = "nounoursbrowser"
    pl.pop("CFBundleIconName", None)
    pl.pop("SUEnableAutomaticChecks", None)
    with open(info, "wb") as fh:
        plistlib.dump(pl, fh)
    for strings in glob.glob(os.path.join(res, "*.lproj", "InfoPlist.strings")):
        try:
            raw = open(strings, "rb").read()
            enc = "utf-16" if raw[:2] in (b"\xff\xfe", b"\xfe\xff") else "utf-8"
            txt = raw.decode(enc)
            txt = re.sub(r'(CFBundle(?:Display)?Name\s*=\s*)"[^"]*"', rf'\1"{NAME}"', txt)
            open(strings, "wb").write(txt.encode(enc))
        except Exception as e:  # fichier inattendu : on le laisse tel quel
            print(f"  (ignoré {strings} : {e})")
    for junk in ("crashreporter.app", "updater.app", "pingsender"):
        for p in glob.glob(os.path.join(app, "Contents", "MacOS", junk)):
            shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    engine, plat = sys.argv[1], sys.argv[2]
    print(f"Rebranding du moteur ({plat}) : {engine}")
    if plat == "macos":
        brand_macos(engine)
    else:
        brand_unix_like(engine, windows=(plat == "windows"))
    print("OK")


if __name__ == "__main__":
    main()
