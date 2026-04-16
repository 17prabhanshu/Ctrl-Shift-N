import httpx
import asyncio
import json

async def test():
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "http://127.0.0.1:8000/api/analyze",
                json={"github_url": "https://github.com/facebook/react/issues/28236"},
                timeout=30.0
            )
            print(f"Status: {response.status_code}")
            print(f"Body: {response.text}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
