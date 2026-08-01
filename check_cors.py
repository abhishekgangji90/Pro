import requests

url = "https://pro-chog.onrender.com/api/v1/health"
headers = {
    "Origin": "https://pro-three-beige.vercel.app"
}

try:
    response = requests.options(url, headers=headers, timeout=30)
    print("OPTIONS Request Status:", response.status_code)
    print("OPTIONS Headers:", response.headers)

    response = requests.get(url, headers=headers, timeout=30)
    print("GET Request Status:", response.status_code)
    print("GET Headers:", response.headers)
    print("Body:", response.text)
except Exception as e:
    print("Error:", e)
