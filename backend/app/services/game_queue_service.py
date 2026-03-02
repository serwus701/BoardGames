from collections import deque
from typing import Optional
import asyncio
import json
import os
import aiofiles  # You will need to pip install aiofiles

from app.models.schemas.game_queue import BaseQueueItem


class QueueNode:
    def __init__(self, game_id: int, user_id: int):
        self.game_id = game_id
        self.added_by = user_id
        self.next: Optional['QueueNode'] = None
        self.prev: Optional['QueueNode'] = None


# --- Queue Manager with Async Lock, Persistence, and Rollback ---
class PersistentQueueManager:
    def __init__(self, storage_path: str = "queue_state.json"):
        self.head: Optional[QueueNode] = None
        self.tail: Optional[QueueNode] = None
        self._size = 0
        self.storage_path = storage_path
        self.lock = asyncio.Lock()  # Prevents race conditions
        self.history = deque(maxlen=20)  # Stores snapshots for rollback

        self._load_from_disk()

    def _get_list_snapshot(self) -> list[BaseQueueItem]:
        res = []
        curr = self.head
        while curr:
            res.append(BaseQueueItem(game_id=curr.game_id, user_id=curr.added_by))
            curr = curr.next
        return res

    async def _save_to_disk(self):
        data = [item.model_dump() for item in self._get_list_snapshot()]
        async with aiofiles.open(self.storage_path, "w") as f:
            await f.write(json.dumps(data))

    def _load_from_disk(self):
        if os.path.exists(self.storage_path):
            with open(self.storage_path, "r") as f:
                content = f.read()
                data = json.loads(content)
                self.head = self.tail = None
                self._size = 0
                for item_dict in data:
                    self._add_logic(item_dict['game_id'], item_dict['user_id'])

    def _add_logic(self, game_id: int, user_id: int):
        new_node = QueueNode(game_id, user_id)
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

    async def add(self, game_id: int, user_id: int):
        async with self.lock:
            await self.record_history()
            self._add_logic(game_id, user_id)
            await self._save_to_disk()

    async def remove(self, game_id: int) -> bool:
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
                    await self._save_to_disk()
                    return True
                curr = curr.next
            return False

    async def remove_batch(self, game_ids: list[int]) -> bool:
        async with self.lock:
            await self.record_history()

            ids_to_remove = set(game_ids)
            curr = self.head
            while curr:
                if curr.game_id in ids_to_remove:
                    # Unlink node
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

            await self._save_to_disk()
            return True

    async def rollback(self) -> bool:
        async with self.lock:
            if not self.history:
                return False
            previous_state = self.history.pop()
            self.head = self.tail = None
            self._size = 0
            for item in previous_state:
                self._add_logic(item.game_id, item.user_id)
            await self._save_to_disk()
            return True

    async def get_all(self) -> list[BaseQueueItem]:
        async with self.lock:
            return self._get_list_snapshot()

    async def create_from_list(self, items: list[BaseQueueItem]):
        async with self.lock:
            await self.record_history()

            # Clear current in-memory state
            self.head = None
            self.tail = None
            self._size = 0

            # Rebuild
            for item in items:
                self._add_logic(item.game_id, item.user_id)

            # Persist changes
            await self._save_to_disk()


# Global Instance
manager = PersistentQueueManager()