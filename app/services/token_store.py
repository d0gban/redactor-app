from collections import defaultdict


class TokenStore:
    def __init__(self):
        self.forward = {}
        self.reverse = {}
        self.counters = defaultdict(int)

    def token_for(self, entity_type: str, value: str) -> str:
        key = (entity_type, value)
        if key in self.forward:
            return self.forward[key]

        self.counters[entity_type] += 1
        token = f"[{entity_type}_{self.counters[entity_type]:03d}]"
        self.forward[key] = token
        self.reverse[token] = {
            "entity_type": entity_type,
            "original": value,
        }
        return token