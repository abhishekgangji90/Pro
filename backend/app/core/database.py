import logging
import asyncio
from typing import Dict, Any, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger("kiranapulse.database")

class MockCollection:
    """In-memory fallback collection when MongoDB daemon is offline."""
    def __init__(self, name: str):
        self.name = name
        self._data: Dict[str, Dict[str, Any]] = {}
        self._id_counter = 100

    async def insert_one(self, document: Dict[str, Any]):
        doc_copy = dict(document)
        if "_id" not in doc_copy:
            self._id_counter += 1
            doc_copy["_id"] = str(self._id_counter)
        self._data[doc_copy["_id"]] = doc_copy
        
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc_copy["_id"])

    async def find_one(self, filter_dict: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for item in self._data.values():
            match = True
            for k, v in filter_dict.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                return dict(item)
        return None

    def find(self, filter_dict: Optional[Dict[str, Any]] = None):
        filter_dict = filter_dict or {}
        results = []
        for item in self._data.values():
            match = True
            for k, v in filter_dict.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                results.append(dict(item))
        
        class AsyncCursor:
            def __init__(self, items):
                self.items = items
            def sort(self, key, direction=1):
                reverse = direction < 0
                self.items.sort(key=lambda x: x.get(key, ""), reverse=reverse)
                return self
            async def to_list(self, length: Optional[int] = None):
                if length is not None:
                    return self.items[:length]
                return self.items
        return AsyncCursor(results)

    async def update_one(self, filter_dict: Dict[str, Any], update_dict: Dict[str, Any]):
        target = await self.find_one(filter_dict)
        if not target:
            class MockUpdateResult:
                modified_count = 0
            return MockUpdateResult()
        
        doc_id = target["_id"]
        if "$set" in update_dict:
            for k, v in update_dict["$set"].items():
                self._data[doc_id][k] = v
        if "$inc" in update_dict:
            for k, v in update_dict["$inc"].items():
                self._data[doc_id][k] = self._data[doc_id].get(k, 0) + v

        class MockUpdateResult:
            modified_count = 1
        return MockUpdateResult()

    async def delete_one(self, filter_dict: Dict[str, Any]):
        target = await self.find_one(filter_dict)
        if target and target["_id"] in self._data:
            del self._data[target["_id"]]
            class MockDeleteResult:
                deleted_count = 1
            return MockDeleteResult()
        class MockDeleteResult:
            deleted_count = 0
        return MockDeleteResult()

class MockDatabase:
    def __init__(self):
        self.collections: Dict[str, MockCollection] = {}
    
    def get_collection(self, name: str) -> MockCollection:
        if name not in self.collections:
            self.collections[name] = MockCollection(name)
        return self.collections[name]
    
    def __getitem__(self, name: str) -> MockCollection:
        return self.get_collection(name)

class DatabaseManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Any = None
    is_mock: bool = False

    async def connect_to_database(self):
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
        try:
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=10000
            )
            # Ping test
            await self.client.admin.command('ping')
            self.db = self.client[settings.DATABASE_NAME]
            self.is_mock = False
            logger.info("Successfully connected to live MongoDB database!")
        except Exception as err:
            logger.warning(f"MongoDB connection notice ({err}). Switching to fast local Mock Storage Mode for dev evaluation.")
            self.db = MockDatabase()
            self.is_mock = True
            await self._seed_mock_data()

    async def close_database_connection(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed.")

    async def _seed_mock_data(self):
        """Pre-populate sample Kirana inventory items for instant testing."""
        inventory_col = self.db["inventory"]
        count = len(await inventory_col.find().to_list(100))
        if count == 0:
            sample_items = [
                {
                    "_id": "item_1",
                    "name": "Fortune Sunlite Sunflower Oil 1L",
                    "category": "Edible Oils",
                    "sku": "OIL-SUN-001",
                    "quantity": 28,
                    "min_stock": 10,
                    "price": 145.0,
                    "unit": "Pouch",
                    "shelf_location": "Aisle A - Rack 2",
                    "expiry_date": "2026-10-15",
                    "status": "In Stock",
                    "created_at": "2026-07-01T10:00:00"
                },
                {
                    "_id": "item_2",
                    "name": "Aashirvaad Shuddh Chakki Atta 5kg",
                    "category": "Flour & Grains",
                    "sku": "GRA-ATT-005",
                    "quantity": 4,
                    "min_stock": 8,
                    "price": 235.0,
                    "unit": "Bag",
                    "shelf_location": "Aisle B - Rack 1",
                    "expiry_date": "2026-12-30",
                    "status": "Low Stock",
                    "created_at": "2026-07-05T11:20:00"
                },
                {
                    "_id": "item_3",
                    "name": "Amul Taaza Toned Milk 500ml",
                    "category": "Dairy & Milk",
                    "sku": "DRY-MLK-500",
                    "quantity": 18,
                    "min_stock": 15,
                    "price": 27.0,
                    "unit": "Pouch",
                    "shelf_location": "Cooler #1",
                    "expiry_date": "2026-08-02",
                    "status": "Near Expiry",
                    "created_at": "2026-07-28T07:30:00"
                },
                {
                    "_id": "item_4",
                    "name": "Tata Salt Vacuum Evaporated 1kg",
                    "category": "Spices & Salt",
                    "sku": "SPC-SLT-001",
                    "quantity": 45,
                    "min_stock": 20,
                    "price": 28.0,
                    "unit": "Packet",
                    "shelf_location": "Aisle A - Rack 4",
                    "expiry_date": "2027-05-20",
                    "status": "In Stock",
                    "created_at": "2026-07-10T09:15:00"
                },
                {
                    "_id": "item_5",
                    "name": "Maggi 2-Minute Masala Noodles 70g",
                    "category": "Packaged Food",
                    "sku": "PKG-NDL-070",
                    "quantity": 2,
                    "min_stock": 25,
                    "price": 14.0,
                    "unit": "Pack",
                    "shelf_location": "Aisle C - Rack 3",
                    "expiry_date": "2026-08-10",
                    "status": "Low Stock",
                    "created_at": "2026-07-12T14:40:00"
                }
            ]
            for item in sample_items:
                await inventory_col.insert_one(item)

db_manager = DatabaseManager()

def get_database():
    return db_manager.db
