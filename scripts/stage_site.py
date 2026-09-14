"""Stage only public assets for Pages; never upload the repository or workflow files."""
from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[1]
out=root/'_site'
out.mkdir(exist_ok=True)
for name in ['index.html','styles.css','app.mjs','core.mjs']:
    shutil.copy2(root/name,out/name)
for name in ['assets','data']:
    shutil.copytree(root/name,out/name,dirs_exist_ok=True)
(out/'.nojekyll').touch()
