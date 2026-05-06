import re

def verifier_regex(pattern: str, targets: list[str], non_targets: list[str]) -> bool:
    try:
        compiled = re.compile(pattern)
        for t in targets:
            if not compiled.search(t):
                return False
        for nt in non_targets:
            if compiled.search(nt):
                return False
        return True
    except re.error:
        return False