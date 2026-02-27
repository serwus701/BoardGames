# --- Doubly Linked List Node ---
from collections import deque
from typing import Optional
import asyncio
import json
import os

class QueueNode:
    def __init__(self, game_id: str):
        self.game_id = game_id
        self.next: Optional['QueueNode'] = None
        self.prev: Optional['QueueNode'] = None


# --- Queue Manager with Async Lock, Persistence, and Rollback ---
class PersistentQueueManager:
    def __init__(self, storage_path: str = "queue_state.json"):
        self.head: Optional[QueueNode] = None
        self.tail: Optional[QueueNode] = None
        self._size = 0
        self.storage_path = storage_path
        self.lock = asyncio.Lock()  # Prevents race conditions during async calls
        self.history = deque(maxlen=20)  # Stores snapshots for rollback

        self._load_from_disk()

    def _get_list_snapshot(self) -> list[str]:
        res = []
        curr = self.head
        while curr:
            res.append(curr.game_id)
            curr = curr.next
        return res

    def _save_to_disk(self):
        with open(self.storage_path, "w") as f:
            json.dump(self._get_list_snapshot(), f)

    def _load_from_disk(self):
        if os.path.exists(self.storage_path):
            with open(self.storage_path, "r") as f:
                data = json.load(f)
                for gid in data:
                    self._add_logic(gid)

    def _add_logic(self, game_id: str):
        new_node = QueueNode(game_id)
        if not self.head:
            self.head = self.tail = new_node
        else:
            self.tail.next = new_node
            new_node.prev = self.tail
            self.tail = new_node
        self._size += 1

    async def record_history(self):
        """Snapshots current state before an operation."""
        self.history.append(self._get_list_snapshot())

    async def add(self, game_id: str):
        async with self.lock:
            await self.record_history()
            self._add_logic(game_id)
            self._save_to_disk()

    async def remove(self, game_id: str) -> bool:
        async with self.lock:
            await self.record_history()
            curr = self.head
            while curr:
                if curr.game_id == game_id:
                    if curr.prev:
                        curr.prev.next = curr.next
                    else:
                        self.head = curr.next
                    if curr.next:
                        curr.next.prev = curr.prev
                    else:
                        self.tail = curr.prev
                    self._size -= 1
                    self._save_to_disk()
                    return True
                curr = curr.next
            return False

    async def remove_batch(self, game_ids: list[str]) -> bool:
        async with self.lock:
            await self.record_history()
            curr = self.head
            while curr:
                if curr.game_id in game_ids:
                    if curr.prev:
                        curr.prev.next = curr.next
                    else:
                        self.head = curr.next
                    if curr.next:
                        curr.next.prev = curr.prev
                    else:
                        self.tail = curr.prev
                    self._size -= 1
                curr = curr.next
            self._save_to_disk()
            return True

    async def rollback(self) -> bool:
        async with self.lock:
            if not self.history:
                return False
            previous_state = self.history.pop()
            # Clear and rebuild from snapshot
            self.head = self.tail = None
            self._size = 0
            for gid in previous_state:
                self._add_logic(gid)
            self._save_to_disk()
            return True

    async def get_all(self) -> list[str]:
        async with self.lock:
            return self._get_list_snapshot()

    async def create_from_list(self, game_ids: list[str]):
        """Clears current queue and rebuilds it from a list of IDs."""
        async with self.lock:
            await self.record_history()

            # Clear current in-memory state
            self.head = None
            self.tail = None
            self._size = 0

            # Rebuild
            for gid in game_ids:
                self._add_logic(gid)

            # Persist changes
            self._save_to_disk()


# Global Instance
manager = PersistentQueueManager()