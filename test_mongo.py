import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_conn():
    url = "mongodb+srv://abhishekgangji90_db_user:Abhishek123@cluster0.ppslrci.mongodb.net/"
    try:
        client = AsyncIOMotorClient(url, serverSelectionTimeoutMS=5000)
        await client.admin.command('ping')
        print("Connected to MongoDB successfully!")
    except Exception as e:
        print("Failed to connect:", e)

if __name__ == "__main__":
    asyncio.run(test_conn())
