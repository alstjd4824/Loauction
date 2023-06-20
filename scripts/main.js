function ApiKeyEnter() { //입력된 api key를 로컬스토리지에 저장하고 page load
    localStorage.setItem("api_key", document.getElementById("api_key").value);
    document.getElementById("api_key").disabled = true;
    document.getElementById("api_key_button").innerHTML = '<i class="fas fa-sm">Api Key 수정</i>';
    document.getElementById("api_key_button").onclick = ApiKeyChange;
}
function ApiKeyChange() { //api key input tag의 활성화
    document.getElementById("api_key").disabled = false;
    document.getElementById("api_key_button").innerHTML = '<i class="fas fa-sm">Api Key 입력</i>';
    document.getElementById("api_key_button").onclick = ApiKeyEnter;
}

window.addEventListener('load', function() {
    document.getElementById("api_key_button").onclick = ApiKeyEnter;
    if (localStorage.getItem("api_key")) {
        document.getElementById("api_key").value = localStorage.getItem("api_key");
        ApiKeyEnter();
    }
});
