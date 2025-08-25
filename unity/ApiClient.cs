using UnityEngine;
using UnityEngine.Networking;
using System.Collections;

public class ApiClient : MonoBehaviour
{
    public static ApiClient Instance { get; private set; }

    private string serverBaseUrl = "http://localhost:3000"; // ⚡ Замени на IP/домен сервера
    private string token;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    public void SetToken(string t) => token = t;

    public IEnumerator Get(string endpoint, System.Action<string> callback)
    {
        UnityWebRequest request = UnityWebRequest.Get(serverBaseUrl + endpoint);
        if (!string.IsNullOrEmpty(token))
        {
            request.SetRequestHeader("Authorization", "Bearer " + token);
        }

        yield return request.SendWebRequest();

        if (request.result == UnityWebRequest.Result.Success)
            callback?.Invoke(request.downloadHandler.text);
        else
            callback?.Invoke(null);
    }

    public IEnumerator Post(string endpoint, string json, System.Action<string> callback)
    {
        UnityWebRequest request = new UnityWebRequest(serverBaseUrl + endpoint, "POST");
        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(json);
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");

        yield return request.SendWebRequest();

        if (request.result == UnityWebRequest.Result.Success)
            callback?.Invoke(request.downloadHandler.text);
        else
            callback?.Invoke(null);
    }
}
