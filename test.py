import requests

def test_get_games():
    response = requests.get("https://games.roblox.com/v2/users/2669600234/favorite/games?accessFilter=2&limit=100&sortOrder=Desc")
    assert response.status_code == 200
    data = response.json()
    return data["data"]

for game in test_get_games():
    print(game["name"])