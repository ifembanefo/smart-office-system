from typing import List
from app.models.sensor import UserPreference


class PreferenceStore:
    def __init__(self):
        self._entries: List[UserPreference] = []

    def add(self, pref: UserPreference):
        self._entries.append(pref)

    def all(self) -> List[UserPreference]:
        return list(self._entries)

    def count(self) -> int:
        return len(self._entries)


preference_store = PreferenceStore()
