#!/usr/bin/env python3
"""Ajoute une section en haut de CHANGELOG.md : scripts/changelog-add.py <version> "<ligne>" """
import datetime, os, sys
v, line = sys.argv[1], sys.argv[2]
p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "CHANGELOG.md")
s = open(p, encoding="utf-8").read()
entry = f"## {v} — {datetime.date.today()}\n\n- {line}\n\n"
s = s.replace("# Journal des versions\n\n", "# Journal des versions\n\n" + entry, 1)
open(p, "w", encoding="utf-8").write(s)
