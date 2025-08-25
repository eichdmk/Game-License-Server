using UnityEngine;
using UnityEngine.Networking;
using TMPro;
using System.Collections;

public class LoginManager : MonoBehaviour
{
    public TMP_InputField usernameField;
    public TMP_InputField passwordField;
    public TMP_Text resultText;

    public void OnLoginButtonPressed()
    {
        StartCoroutine(SendLoginRequest(usernameField.text, passwordField.text));
    }

    IEnumerator SendLoginRequest(string username, string password)
    {
        string json = JsonUtility.ToJson(new LoginData(username, password));

        yield return ApiClient.Instance.Post("/login", json, (response) =>
        {
            if (string.IsNullOrEmpty(response))
            {
                resultText.text = "Ошибка входа!";
                return;
            }

            LoginResponse res = JsonUtility.FromJson<LoginResponse>(response);
            if (!string.IsNullOrEmpty(res.token))
            {
                resultText.text = "Вход успешен!";
                ApiClient.Instance.SetToken(res.token);

                UnityEngine.SceneManagement.SceneManager.LoadScene("ArenaLoaderScene");
            }
            else
            {
                resultText.text = "Неверный логин или пароль";
            }
        });
    }

    [System.Serializable]
    public class LoginData
    {
        public string username;
        public string password;
        public LoginData(string u, string p) { username = u; password = p; }
    }

    [System.Serializable]
    public class LoginResponse
    {
        public string token;
        public UserInfo user;
    }

    [System.Serializable]
    public class UserInfo
    {
        public string username;
        public int isAdmin;
    }
}
