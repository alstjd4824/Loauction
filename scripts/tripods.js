function sleep(t) {
    return new Promise(resolve => setTimeout(resolve, t));
}

async function GetInfo() { // 필요한 정보 가져오기
    try {
        const response = await fetch('https://developer-lostark.game.onstove.com/auctions/options', {
            method: "GET",
            headers: {
                "accept": "application/json",
                "authorization": `bearer ${localStorage.getItem("api_key")}`
            }
        });
        if (response.status == 429) {
            await sleep(60 * 1000);
            return GetInfo();
        } else if (response.status == 401) {
            alert("Api key is unavailable.");
        } else {
            return response.json();
        }
    } catch (error) {
        console.log(error);
    }
}

async function GetPrice(status, skill_value, tripod_value) { // 트라이포드 가격 검색
    try {
        const response = await fetch('https://developer-lostark.game.onstove.com/auctions/items', { 
            method: "POST",
            headers: {
                "accept": "application/json",
                "authorization": `bearer ${localStorage.getItem("api_key")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "ItemLevelMin": 0,
                "ItemLevelMax": 1700,
                "ItemGradeQuality": null,
                "SkillOptions": [
                    {
                    "FirstOption": skill_value,
                    "SecondOption": tripod_value,
                    "MinValue": 5,
                    "MaxValue": null
                    }
                ],
                "EtcOptions": [
                    {
                    "FirstOption": null,
                    "SecondOption": null,
                    "MinValue": null,
                    "MaxValue": null
                    }
                ],
                "Sort": "BUY_PRICE",
                "CategoryCode": 170300,
                "CharacterClass": null,
                "ItemTier": null,
                "ItemGrade": null,
                "ItemName": null,
                "PageNo": 0,
                "SortCondition": "ASC"
            })
        });
        if (response.status == 429) {
            status.insertAdjacentHTML("beforeend", " 분당 요청량 초과, 1분 후 검색이 재개됩니다.");
            await sleep(60 * 1000);
            return GetPrice(status, skill_value, tripod_value);
        } else if (response.status == 401) {
            alert("Api key is unavailable.");
        } else {
            const result = await response.json();
            if (result["Items"] && result["Items"].length) {
                return result["Items"][0]["AuctionInfo"]["BuyPrice"];
            } else {
                return -1;
            }
        }
    } catch (error) {
        console.log(error);
    }
}

async function AddClassButton(class_name, skill_list) {
    let li = document.getElementById("class-buttons").appendChild(document.createElement('li'));
    li.setAttribute('class', 'nav-item my-1 mx-2');
    let classbutton = li.appendChild(document.createElement('button'));
    classbutton.setAttribute('class', 'btn btn-block btn-primary btn-icon-class');
    let span = classbutton.appendChild(document.createElement('span'));
    span.setAttribute('class', 'text');
    span.innerText = class_name;
    
    classbutton.addEventListener("click",  async function(){ // 버튼을 누르면 해당 클래스의 카드 생성
        let isThereCard = false;
        let card_list = document.getElementById("content-body").children;
        for (let j = 0; j < card_list.length; j++) {
            if (card_list[j].children[0].children[0].innerText == class_name) { //해당 class의 카드가 이미 있는지 확인
                isThereCard = true;
            }
        }
        if (!isThereCard) {
            AddCard(class_name, skill_list);
        }
    });
}

async function AddCard(class_name, skill_list) {
    let class_skill_list = skill_list.filter((x) => x["Class"] == class_name); // 해당 직업 스킬 리스트 필터링
    let content_body = document.getElementById("content-body");
    
    // card component
    let card = content_body.appendChild(document.createElement('div'));
    card.setAttribute("class", "card shadow mb-4");
    let card_header = card.appendChild(document.createElement('div'));
    card_header.setAttribute("class", "card-header py-3");
    let card_body = card.appendChild(document.createElement('div'));
    card_body.setAttribute("class", "card-body");
    

    // header element
    let card_title = card_header.appendChild(document.createElement('h6')); // class name
    card_title.setAttribute("class", "m-0 font-weight-bold text-primary align-self-center");
    card_title.innerHTML = class_name;
    let button_group = card_header.appendChild(document.createElement('div'));
    let search_button = button_group.appendChild(document.createElement('button')); // search tripods price
    search_button.setAttribute("class", "card-btn");
    search_button.innerHTML = '<i class="fas fa-repeat"></i>';
    let delete_button = button_group.appendChild(document.createElement('button')); // delete card
    delete_button.setAttribute("class", "card-btn");
    delete_button.innerHTML = '<i class="fas fa-trash"></i>';
    
    // body element
    let table_res = card_body.appendChild(document.createElement('div'));
    table_res.setAttribute("class", "table-responsive");
    let table_wrapper = table_res.appendChild(document.createElement('div'));
    table_wrapper.setAttribute("id", "dataTable_wrapper");
    table_wrapper.setAttribute("class", "dataTables_wrapper dt-bootstrap4");
    let first_row = table_wrapper.appendChild(document.createElement('div'));
    first_row.setAttribute("class", "row");
    let status = first_row.appendChild(document.createElement('div'));
    status.setAttribute("class", "col-sm-12 col-md-6");
    let filter_col = first_row.appendChild(document.createElement('div'));
    filter_col.setAttribute("class", "col-sm-12 col-md-6");
    let table_filter = filter_col.appendChild(document.createElement('div'));
    table_filter.setAttribute("class", "dataTables_filter");
    let label = table_filter.appendChild(document.createElement('label'));
    label.innerHTML = '기준 가격:';
    let filter_input = label.appendChild(document.createElement('input'));
    filter_input.setAttribute("type", "number");
    filter_input.setAttribute("class", "form-control form-control-sm");
    let second_row = table_wrapper.appendChild(document.createElement('div'));
    second_row.setAttribute("class", "row");
    let table_list = second_row.appendChild(document.createElement('div'));
    table_list.setAttribute("class", "col-sm-12");

    //add event 
    search_button.addEventListener("click", function(){
        SearchTripods(table_list, status, class_skill_list);
    });
    delete_button.addEventListener("click", function(){
        content_body.removeChild(card);
    });
    filter_input.addEventListener("input", function(){
        for (let i = 0; i < table_list.children.length; i++) { //skill table마다 처리
            let tripods_name_table = table_list.children[i].children[0].children[0]; // <tr>
            let tripods_price_table = table_list.children[i].children[1].children[0]; //<tr>
            for (let j = 1; j < tripods_price_table.children.length; j++) {
                if (Number(filter_input.value) == 0 || !Number(tripods_price_table.children[j].innerText)) {
                    tripods_name_table.children[j].removeAttribute("class");
                    tripods_price_table.children[j].removeAttribute("class");
                } else if (Number(filter_input.value) <= Number(tripods_price_table.children[j].innerText)) {
                    tripods_name_table.children[j].removeAttribute("class");
                    tripods_price_table.children[j].setAttribute("class", "border-bottom-primary");
                } else {
                    tripods_name_table.children[j].setAttribute("class", "text-gray-500 bg-gray-100");
                    tripods_price_table.children[j].setAttribute("class", "text-gray-500 bg-gray-100");
                }                
            }
        }
    });
    SearchTripods(table_list, status, class_skill_list);
}

async function SearchTripods(table_list, status, class_skill_list) {
    table_list.innerHTML = ""; //트포 테이블 clear

    let search_count = 0; // 현재 검색 횟수
    let search_count_max = 0; // 작업이 완료되는 검색 횟수
    for (let i = 0; i < class_skill_list.length; i++) {
        for (let j = 0; j < class_skill_list[i]["Tripods"].length; j++) {
            if (!(class_skill_list[i]["Tripods"][j]["IsGem"])) {
               ++search_count_max; 
            }
        }
    }

    for (let i = 0; i < class_skill_list.length; i++) { // 스킬별로 테이블 추가
        let isTripodSkill = false; // 트라이포드가 있는 스킬인가
        
        let tripods_table = document.createElement('table'); // 스킬 하나의 트라이포드들의 가격표
        tripods_table.setAttribute("class", "table table-bordered dataTable");
        let thead = tripods_table.appendChild(document.createElement('thead'));
        let tripods_name_table = thead.appendChild(document.createElement('tr')); // 스킬의 트라이포드 이름들
        let tbody = tripods_table.appendChild(document.createElement('tbody'));
        let tripods_price_table = tbody.appendChild(document.createElement('tr')); // 트라이포드의 가격들
    
        let skill_name = tripods_name_table.appendChild(document.createElement('th')); // 스킬명 테이블1열
        skill_name.setAttribute("class", "bg-primary text-gray-100");
        skill_name.setAttribute("width", "15%")
        skill_name.innerText = class_skill_list[i]["Text"];
        tripods_price_table.appendChild(document.createElement('td')).innerText = "최저가"; // 테이블1열
        
        for (let j = 0; j < class_skill_list[i]["Tripods"].length; j++) { // 트라이포드마다 열 추가
            if (!(class_skill_list[i]["Tripods"][j]["IsGem"])) { // 트라이포드인지 체크
                isTripodSkill = true;
                let price = await GetPrice(status, class_skill_list[i]["Value"], class_skill_list[i]["Tripods"][j]["Value"]); // 트라이포드 가격, 매물이 없다면 -1
                if (price == -1) {
                    price = "매물 없음";
                }
                tripods_name_table.appendChild(document.createElement('th')).innerText = class_skill_list[i]["Tripods"][j]["Text"]; // 트포명
                tripods_price_table.appendChild(document.createElement('td')).innerText = price; // 트포가격
                status.innerText = `${++search_count}/${search_count_max}`; // 검색 횟수 표시
            }
        }

        if (isTripodSkill) {
            table_list.appendChild(tripods_table);
        }
        
    }
}

async function ClassButtonLoad() {
    try {
        var info = await GetInfo();
        let classes = info["Classes"]; //전 직업 리스트
        let skill_list = info["SkillOptions"]; //모든 스킬 리스트
        
        document.getElementById("class-buttons").innerHTML = ""; // class button 목록 clear
        for (let i = 0; i < classes.length; i++) {
            AddClassButton(classes[i], skill_list);
        }
    } catch (error) {
        console.log(error);
    }
}

window.addEventListener('load', ClassButtonLoad);