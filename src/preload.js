const config = require("./config");
const fetch = require('node-fetch');
const {exec} = require("child_process");

let value = ""  // setting 时，记录用户输入的值

async function search(searchWord) {
    const searchResult = []
    const cookie = utools.dbStorage.getItem("cookie")
    const spaceId = utools.dbStorage.getItem("spaceId")
    const response = await fetch("https://www.notion.so/api/v3/search", {
        "headers": {
            "accept": "*/*",
            "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
            "content-type": "application/json",
            "notion-client-version": "23.9.0.36",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"90\", \"Google Chrome\";v=\"90\"",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-notion-active-user-header": "5071bdc3-8e9f-4ced-9e43-ea5909735a72",
            "cookie": cookie
        },
        "body": "{\"type\":\"BlocksInSpace\",\"query\":\"" + searchWord + "\",\"spaceId\":\"" + spaceId + "\",\"limit\":9,\"filters\":{\"isDeletedOnly\":false,\"excludeTemplates\":false,\"isNavigableOnly\":false,\"requireEditPermissions\":false,\"ancestors\":[],\"createdBy\":[],\"editedBy\":[],\"lastEditedTime\":{},\"createdTime\":{}},\"sort\":\"Relevance\",\"source\":\"quick_find\"}",
        "method": "POST",
        "mode": "cors"
    });
    const json_data = await response.json()
    const results = json_data.results
    const block = json_data.recordMap.block
    const collection = json_data.recordMap.collection
    const useDesktopClient = utools.dbStorage.getItem("useDesktopClient")
    let link = useDesktopClient === "true" ? "notion://www.notion.so/" : "https://www.notion.so/"

    for (let i = 0; i <= results.length; i++) {
        const item = results[i]
        let title = ""
        let description = ""
        let icon = "icon.png"

        if (item === undefined) {
            continue
        }

        const id = item.id
        link = link + id.replaceAll("-", "")

        // title
        try {
            title = block[id].value.properties.title[0][0]
        } catch (e) {
            if (e.toString().indexOf("title") !== -1) {
                title = collection[block[id].value.collection_id].value.name[0][0]
            }
        }

        // 图标
        try {
            icon = block[id].value.format.page_cover !== undefined ? "https://www.notion.so" + block[id].value.format.page_cover : "icon.png"
        } catch (e) {
            console.log(e)
        }

        if (item.highlight.pathText) {
            description = item.highlight.pathText.replaceAll("<gzkNfoUU>", "").replaceAll("</gzkNfoUU>", "")
        }

        searchResult.push(
            {
                "title": title,
                "description": description,
                "icon": icon,
                "link": link
            }
        )
    }
    // console.log(searchResult, "///")
    return searchResult
}


let NSet = {
    mode: "list",
    args: {
        enter: (action, callbackSetList) => {
            // 读取数据库的值，没有则返回默认值
            const cookie = utools.dbStorage.getItem("cookie")
            if (cookie && cookie.length) {
                config.configs[0].description = cookie
            }
            const spaceId = utools.dbStorage.getItem("spaceId")
            if (spaceId && spaceId.length) {
                config.configs[1].description = spaceId
            }
            const useDesktopClient = utools.dbStorage.getItem("useDesktopClient")
            if (useDesktopClient && useDesktopClient.length) {
                config.configs[2].description = useDesktopClient
            }

            callbackSetList(config.configs);
        },

        search: (action, searchWord, callbackSetList) => {
            value = searchWord
            callbackSetList(config.configs);
        },

        select: (action, itemData) => {
            // 记录搜索框的值到指定的选择项
            if (!value) return;
            utools.dbStorage.setItem(itemData.title, value) // 记录到数据库
            utools.showNotification(itemData.title + "设置成功！");

            utools.outPlugin();     // 关闭插件
            utools.hideMainWindow();    // 隐藏 uTools 窗口
        },
    },
};


let NS = {
    mode: "list",
    args: {
        enter: async (action, callbackSetList) => {
            callbackSetList([]);
        },

        search: async (action, searchWord, callbackSetList) => {
            if (!searchWord) return callbackSetList([]);

            callbackSetList([
                {
                    "title": searchWord,
                    "description": "在 Notion 中搜索" + searchWord,
                    "icon": "logo.png"
                }
            ]);
        },

        select: async (action, itemData, callbackSetList) => {
            if (itemData.icon === "logo.png") { // 搜索
                callbackSetList([]);
                const searchResult = await search(itemData.title)
                callbackSetList(searchResult);
                return;
            }

            // notion app 打开
            // 浏览器打开

            let command = `open ${itemData.link}`;
            exec(command, (err) => {
                if (err) utools.showNotification(err);
            });

            utools.outPlugin();     // 关闭插件
            utools.hideMainWindow();    // 隐藏 uTools 窗口
        },
    },
};


/**
 * 导出
 */
window.exports = {
    NSet,
    NS
};
