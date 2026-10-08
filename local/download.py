"""One-time download of the published multilingual checkpoint into this project."""
from pathlib import Path
from huggingface_hub import snapshot_download
from laya.revisions import PINNED_REVISIONS

ROOT = Path(__file__).resolve().parents[1]
REPO = "convaiinnovations/laya-multilingual"
target = ROOT / ".runtime" / "models" / "laya-multilingual"
snapshot_download(
    REPO,
    revision=PINNED_REVISIONS[REPO],
    local_dir=target,
    allow_patterns=["model.safetensors", "rl_agent_config.json", "encoder/config.json", "tokenizer/*"],
    max_workers=3,
)
print(f"Local model ready: {target}")
