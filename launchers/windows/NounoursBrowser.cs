// Nounours Browser — lanceur Windows (NounoursBrowser.exe)
// Compilé avec le csc de .NET Framework 4 (présent sur tout Windows 10/11) : aucune dépendance.
//
//  - Au premier lancement, télécharge le moteur Firefox ESR dans %LOCALAPPDATA%\NounoursBrowser\engine
//  - Le profil vit dans %LOCALAPPDATA%\NounoursBrowser\profile : il survit aux mises à jour
//    faites par NounoursLauncher (qui remplace entièrement le dossier de l'appli).
//  - À chaque lancement : recopie userChrome.css, user.js, l'extension et policies.json.
//
// Options : --eco (mode Ultra éco, mémorisé)   --balanced (revenir au mode normal)
//           --reinstall-engine                 Variable NB_FIREFOX = chemin d'un firefox.exe à utiliser

using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Net;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;

[assembly: System.Reflection.AssemblyTitle("Nounours Browser")]
[assembly: System.Reflection.AssemblyProduct("Nounours Browser")]
[assembly: System.Reflection.AssemblyCompany("NounoursCorp")]
[assembly: System.Reflection.AssemblyCopyright("NounoursCorp")]
// Remplacés par la CI (scripts/stamp-version.sh) ; « 0.0.0 » en développement
[assembly: System.Reflection.AssemblyVersion("0.0.0.0")]
[assembly: System.Reflection.AssemblyFileVersion("0.0.0.0")]
[assembly: System.Reflection.AssemblyInformationalVersion("0.0.0-dev")]

static class NounoursBrowser
{
    const string ExtId = "nounours-browser@didikaria.fr";
    const string EsrUrl = "https://download.mozilla.org/?product=firefox-esr-latest-ssl&os=win64&lang=fr";

    static string AppDir, DataDir, EngineDir, ProfileDir;

    [STAThread]
    static int Main(string[] args)
    {
        Application.EnableVisualStyles();
        try
        {
            AppDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "app");
            DataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "NounoursBrowser");
            EngineDir = Path.Combine(DataDir, "engine");
            ProfileDir = Path.Combine(DataDir, "profile");
            Directory.CreateDirectory(DataDir);

            if (!Directory.Exists(AppDir)) throw new Exception("Dossier « app » introuvable à côté de NounoursBrowser.exe.");

            string modeFile = Path.Combine(DataDir, "mode.txt");
            if (args.Contains("--eco")) File.WriteAllText(modeFile, "eco");
            if (args.Contains("--balanced")) File.WriteAllText(modeFile, "balanced");
            bool eco = File.Exists(modeFile) && File.ReadAllText(modeFile).Trim() == "eco";

            string firefox = Environment.GetEnvironmentVariable("NB_FIREFOX");
            string engineId = "custom";
            if (string.IsNullOrEmpty(firefox) || !File.Exists(firefox))
            {
                // Moteur rebrandé livré avec l'appli : engine-<version>\ (le plus récent ; les anciens sont nettoyés)
                string bundled = FindBundledEngine();
                if (bundled != null)
                {
                    firefox = Path.Combine(bundled, "firefox.exe");
                    engineId = Path.GetFileName(bundled);
                    try { if (Directory.Exists(EngineDir)) Directory.Delete(EngineDir, true); } catch { } // moteur 1.0.x téléchargé
                }
                else
                {
                    // Développement : pas de moteur livré → Firefox ESR téléchargé (non rebrandé)
                    firefox = Path.Combine(EngineDir, "firefox.exe");
                    if (args.Contains("--reinstall-engine") || !File.Exists(firefox)) InstallEngine();
                    if (!File.Exists(firefox)) throw new Exception("Le moteur n'a pas pu être installé.");
                    CopyPolicies(EngineDir);
                    engineId = "download";
                }
            }

            PrepareProfile(eco);

            // Liens ou fichiers à ouvrir (ex. clic sur un lien quand Nounours Browser est le navigateur par défaut)
            var cmd = new StringBuilder("-profile \"" + ProfileDir + "\"");
            string engineFile = Path.Combine(DataDir, "engine-version.txt");
            string lastEngine = File.Exists(engineFile) ? File.ReadAllText(engineFile).Trim() : "";
            if (lastEngine != engineId)
            {
                cmd.Append(" -purgecaches"); // nouveau moteur : caches de démarrage à refaire
                try { File.WriteAllText(engineFile, engineId); } catch { }
            }
            foreach (string a in args)
                if (!a.StartsWith("--")) cmd.Append(" \"").Append(a.Replace("\"", "")).Append("\"");
            var psi = new ProcessStartInfo(firefox, cmd.ToString());
            psi.UseShellExecute = false;
            psi.WorkingDirectory = Path.GetDirectoryName(firefox);
            Process.Start(psi);
            return 0;
        }
        catch (Exception ex)
        {
            MessageBox.Show(ex.Message, "Nounours Browser", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
    }

    // ------------------------------------------------------------------ Moteur livré
    static string FindBundledEngine()
    {
        string root = AppDomain.CurrentDomain.BaseDirectory;
        var engines = Directory.GetDirectories(root, "engine*")
            .Where(d => File.Exists(Path.Combine(d, "firefox.exe")))
            .OrderByDescending(d => File.GetLastWriteTimeUtc(Path.Combine(d, "firefox.exe")))
            .ThenByDescending(d => d, StringComparer.OrdinalIgnoreCase)
            .ToList();
        if (engines.Count == 0) return null;
        // Les moteurs des versions précédentes sont supprimés s'ils ne sont plus utilisés
        foreach (string old in engines.Skip(1))
        {
            try { Directory.Delete(old, true); } catch { }
        }
        return engines[0];
    }

    // ------------------------------------------------------------------ Profil
    static void PrepareProfile(bool eco)
    {
        string tpl = Path.Combine(AppDir, "profile-template");
        Directory.CreateDirectory(Path.Combine(ProfileDir, "extensions"));
        CopyDir(Path.Combine(tpl, "chrome"), Path.Combine(ProfileDir, "chrome"));

        var sb = new StringBuilder(File.ReadAllText(Path.Combine(tpl, "user.js")));
        if (eco) sb.Append("\n").Append(File.ReadAllText(Path.Combine(tpl, "user-eco.js")));
        // Préférences personnelles : fichier conservé dans le dossier de données (jamais écrasé)
        string userOverrides = Path.Combine(DataDir, "user-overrides.js");
        if (!File.Exists(userOverrides)) SafeCopy(Path.Combine(tpl, "user-overrides.js"), userOverrides);
        if (File.Exists(userOverrides)) sb.Append("\n").Append(File.ReadAllText(userOverrides));
        SafeWrite(Path.Combine(ProfileDir, "user.js"), sb.ToString());

        SafeCopy(Path.Combine(AppDir, "nounours-browser.xpi"), Path.Combine(ProfileDir, "extensions", ExtId + ".xpi"));
    }

    // Quand Nounours Browser est déjà ouvert, Firefox garde certains fichiers ouverts (l'extension .xpi
    // notamment) : Windows refuse alors de les remplacer. On ne réécrit donc que ce qui a changé,
    // et un fichier verrouillé est simplement mis à jour au prochain démarrage.
    static void SafeCopy(string src, string dst)
    {
        try
        {
            if (File.Exists(dst) && SameContent(src, dst)) return;
            File.Copy(src, dst, true);
        }
        catch (IOException) { }
        catch (UnauthorizedAccessException) { }
    }

    static void SafeWrite(string dst, string content)
    {
        try
        {
            if (File.Exists(dst) && File.ReadAllText(dst) == content) return;
            File.WriteAllText(dst, content, new UTF8Encoding(false));
        }
        catch (IOException) { }
        catch (UnauthorizedAccessException) { }
    }

    static bool SameContent(string a, string b)
    {
        var fa = new FileInfo(a); var fb = new FileInfo(b);
        if (fa.Length != fb.Length) return false;
        using (var sha = System.Security.Cryptography.SHA256.Create())
        using (var sa = File.Open(a, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete))
        using (var sb = File.Open(b, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete))
        {
            return sha.ComputeHash(sa).SequenceEqual(sha.ComputeHash(sb));
        }
    }

    static void CopyPolicies(string engineDir)
    {
        string dist = Path.Combine(engineDir, "distribution");
        Directory.CreateDirectory(dist);
        SafeCopy(Path.Combine(AppDir, "distribution", "policies.json"), Path.Combine(dist, "policies.json"));
    }

    static void CopyDir(string src, string dst)
    {
        Directory.CreateDirectory(dst);
        foreach (string f in Directory.GetFiles(src)) SafeCopy(f, Path.Combine(dst, Path.GetFileName(f)));
        foreach (string d in Directory.GetDirectories(src)) CopyDir(d, Path.Combine(dst, Path.GetFileName(d)));
    }

    // ------------------------------------------------------------------ Moteur (Firefox ESR)
    static void InstallEngine()
    {
        ServicePointManager.SecurityProtocol |= (SecurityProtocolType)3072 | (SecurityProtocolType)12288; // TLS 1.2 / 1.3
        string tmp = Path.Combine(DataDir, "engine-download");
        if (Directory.Exists(tmp)) Directory.Delete(tmp, true);
        Directory.CreateDirectory(tmp);
        string setup = Path.Combine(tmp, "firefox-esr-setup.exe");
        string extract = Path.Combine(tmp, "x");
        Directory.CreateDirectory(extract);

        Exception error = null;
        var form = new ProgressForm();
        form.Shown += delegate
        {
            var t = new Thread(delegate ()
            {
                try
                {
                    using (var wc = new WebClient())
                    {
                        wc.Headers.Add("User-Agent", "NounoursBrowser");
                        var done = new ManualResetEvent(false);
                        Exception dlErr = null;
                        wc.DownloadProgressChanged += (s, e) => form.SetProgress(e.ProgressPercentage, e.BytesReceived, e.TotalBytesToReceive);
                        wc.DownloadFileCompleted += (s, e) => { dlErr = e.Error; done.Set(); };
                        wc.DownloadFileAsync(new Uri(EsrUrl), setup);
                        done.WaitOne();
                        if (dlErr != null) throw new Exception("Téléchargement impossible : " + dlErr.Message);
                    }
                    form.SetStatus("Installation du moteur…", -1);
                    // L'installeur complet de Firefox sait juste extraire ses fichiers (/ExtractDir).
                    // Chemin court 8.3 : évite tout souci avec un nom d'utilisateur contenant des espaces.
                    var p = Process.Start(new ProcessStartInfo(setup, "/ExtractDir=" + ShortPath(extract)) { UseShellExecute = false, CreateNoWindow = true });
                    p.WaitForExit();
                    string ffExe = Directory.GetFiles(extract, "firefox.exe", SearchOption.AllDirectories).FirstOrDefault();
                    if (ffExe == null) throw new Exception("Fichiers du moteur introuvables après extraction.");
                    if (Directory.Exists(EngineDir)) Directory.Delete(EngineDir, true);
                    Directory.Move(Path.GetDirectoryName(ffExe), EngineDir);
                }
                catch (Exception ex) { error = ex; }
                finally
                {
                    try { Directory.Delete(tmp, true); } catch { }
                    form.BeginInvoke((MethodInvoker)form.Close);
                }
            });
            t.IsBackground = true;
            t.Start();
        };
        Application.Run(form);
        if (error != null) throw error;
    }

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
    static extern uint GetShortPathName(string lpszLongPath, StringBuilder lpszShortPath, uint cchBuffer);

    static string ShortPath(string path)
    {
        var sb = new StringBuilder(1024);
        uint n = GetShortPathName(path, sb, (uint)sb.Capacity);
        string s = n > 0 ? sb.ToString() : path;
        return s.Contains(" ") ? "\"" + s + "\"" : s;
    }

    // ------------------------------------------------------------------ Fenêtre de progression
    class ProgressForm : Form
    {
        readonly Label status = new Label();
        readonly ProgressBar bar = new ProgressBar();

        public ProgressForm()
        {
            Text = "Nounours Browser";
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = MinimizeBox = false;
            StartPosition = FormStartPosition.CenterScreen;
            ClientSize = new Size(420, 130);
            Font = new Font("Segoe UI", 9.5f);
            BackColor = Color.White;
            try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }

            var title = new Label { Text = "Préparation de Nounours Browser", Font = new Font("Segoe UI Semibold", 12f), AutoSize = true, Location = new Point(20, 16) };
            status.Text = "Téléchargement du moteur (Firefox ESR)… première ouverture uniquement.";
            status.AutoSize = false; status.Size = new Size(380, 22); status.Location = new Point(20, 50);
            status.ForeColor = Color.FromArgb(110, 110, 115);
            bar.Location = new Point(20, 82); bar.Size = new Size(380, 14);
            Controls.Add(title); Controls.Add(status); Controls.Add(bar);
        }

        public void SetProgress(int pct, long got, long total)
        {
            BeginInvoke((MethodInvoker)delegate
            {
                bar.Style = ProgressBarStyle.Continuous;
                bar.Value = Math.Max(0, Math.Min(100, pct));
                if (total > 0) status.Text = string.Format("Téléchargement du moteur… {0} / {1} Mo", got / 1048576, total / 1048576);
            });
        }

        public void SetStatus(string text, int pct)
        {
            BeginInvoke((MethodInvoker)delegate
            {
                status.Text = text;
                bar.Style = pct < 0 ? ProgressBarStyle.Marquee : ProgressBarStyle.Continuous;
            });
        }
    }
}
