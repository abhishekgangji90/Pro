import requests

url = "https://pro-chog.onrender.com/api/v1/health"
headers = {
    "Origin": "https://pro-three-beige.vercel.app",
    "Access-Control-Request-Method": "GET"
}

try:
    response = requests.options(url, headers=headers, timeout=30)
    print("OPTIONS Request Status:", response.status_code)
    print("OPTIONS Headers:", response.headers)
except Exception as e:
    print("Error:", e)
