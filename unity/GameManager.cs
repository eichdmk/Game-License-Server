using UnityEngine;
using System.Collections;

public class GameManager : MonoBehaviour
{
    void Start()
    {
        StartCoroutine(CheckLicense());
    }

    IEnumerator CheckLicense()
    {
        yield return ApiClient.Instance.Get("/users/me", (response) =>
        {
            if (string.IsNullOrEmpty(response))
            {
                Debug.LogError("Ошибка при запросе данных!");
                UnityEngine.SceneManagement.SceneManager.LoadScene("LoginScene");
                return;
            }

            UserData user = JsonUtility.FromJson<UserData>(response);

            if (user.licenseLeftSeconds > 0)
            {
                Debug.Log("Лицензия активна, запускаем арену!");
                UnityEngine.SceneManagement.SceneManager.LoadScene("ArenaScene");
            }
            else
            {
                Debug.Log("Лицензия закончилась!");
                UnityEngine.SceneManagement.SceneManager.LoadScene("LoginScene");
            }
        });
    }

    [System.Serializable]
    public class UserData
    {
        public int id;
        public string username;
        public bool isAdmin;
        public long licenseEndDate;
        public int licenseLeftSeconds;
        public int licenseLeftDays;
    }
}
