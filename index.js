var listAPI = 'https://64df39cc71c3335b258249fa.mockapi.io/api/1/list'

document.querySelector('.addTask').addEventListener('click', () => {
    document.querySelector('.Add').classList.add('active')
})
document.querySelector('.cancel').addEventListener('click', () => {
    document.querySelector('.Add').classList.remove('active')
})
document.querySelector('.modal').addEventListener('click', () => {
    document.querySelector('.Add').classList.remove('active')
})
document.querySelector('.modal-content').addEventListener('click', (e) => {
    e.stopPropagation();
})

var content = document.querySelector('body')
var darkMode = document.getElementById('dark-change');
let filter = document.querySelector('#filter')

async function init() {
    let data = JSON.parse(localStorage.getItem('DarkMode'))
    if (data === 'true') {
        content.classList.add('night')
        darkMode.classList.add('active');
    }
    
    const lists = await getLists();
    renderList(lists)
    filter.addEventListener('change', filterTodos)
    addTodoElement()
}

init()

async function getLists() {
    let response = await fetch(listAPI)
    return response.json()
}

function createListElement(list) {
    return `
      <li class="item${list.id}">
        <input type="checkbox" id="check" ${list.checked ? 'checked' : ''} onclick="finishList(${list.id})">
        <span class="name">${list.name}</span>
        <span class="level">${list.level}</span>
        <span class="deadline" style="display: none;">${list.deadline}</span>
        <span class="countdown"></span>
        <i class="far fa-edit" id="edit" onclick="editList(${list.id})"></i>
        <i class="fas fa-trash" id="delete" onclick="deleteList(${list.id})"></i>  
      </li>
    `
}

function renderList(lists) {
    var todos = document.querySelector('.todos')
    todos.innerHTML = lists.map(list => createListElement(list)).join('')
    lists.forEach(list => {
        if (list.checked) {
            document.querySelector(`.item${list.id}`).classList.add('complete')
        }
        if (list.level === "Over time") {
            document.querySelector(`.item${list.id}`).classList.add('overtime')
            document.querySelector(`.item${list.id}`).querySelector('.countdown').innerText = '00 : 00 : 00 : 00'
        }
        let future = new Date(list.deadline).getTime()
        CountDouwn(future, document.querySelector(`.item${list.id}`).querySelector('.countdown'))
    })
}

function creatList(data) {
    var options = {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    }

    fetch(listAPI, options)
        .then(response => response.json())
        .then(newList => {
            document.querySelector('.todos').insertAdjacentHTML('beforeend', createListElement(newList))
            attachCountdown(newList)
        })
}

function deleteList(id) {
    var options = {
        method: 'DELETE',
        headers: { "Content-Type": "application/json" },
    }

    fetch(listAPI + '/' + id, options)
        .then(response => response.json())
        .then(() => {
            document.querySelector(`.item${id}`).remove()
        })
}

function putList(id, data) {
    var options = {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    }

    fetch(listAPI + '/' + id, options)
        .then(response => response.json())
        .then(updatedList => {
            let listElement = document.querySelector(`.item${id}`)
            listElement.querySelector('.name').innerText = updatedList.name
            listElement.querySelector('.deadline').innerText = updatedList.deadline
            listElement.querySelector('.level').innerText = updatedList.level
            listElement.querySelector('.countdown').innerText = ''
            attachCountdown(updatedList)
        })
}

function editList(id) {
    let editButton = document.querySelector('.Edit')
    editButton.classList.add('active')
    let listEdit = document.querySelector(`.item${id}`)
    editButton.querySelector('#textEdit').value = listEdit.querySelector('.name').innerText
    editButton.querySelector('#timeEdit').value = listEdit.querySelector('.deadline').innerText

    editButton.querySelector('.cancel').addEventListener('click', () => {
        editButton.classList.remove('active')
    })

    editButton.querySelector('.save').addEventListener('click', () => {
        let updatedData = {
            name: editButton.querySelector('#textEdit').value,
            deadline: editButton.querySelector('#timeEdit').value,
            level: countLevel(editButton.querySelector('#timeEdit').value),
        }
        putList(id, updatedData)
        editButton.classList.remove('active')
    })
}

function finishList(id) {
    let listFinish = document.querySelector(`.item${id}`)
    listFinish.classList.toggle('complete')
    let checkedStatus = listFinish.classList.contains('complete')
    putList(id, { checked: checkedStatus })
}

function CountDouwn(future, text) {
    let loop = future - new Date().getTime()
    var interValid = setInterval(() => {
        var now = new Date().getTime()
        var d = future - now
        var days = Math.floor(d / (1000 * 60 * 60 * 24))
        var hours = Math.floor((d / (1000 * 60 * 60)) % 24)
        var minutes = Math.floor((d / (1000 * 60)) % 60)
        var seconds = Math.floor((d / 1000) % 60)
        text.innerText = `${days} : ${hours} : ${minutes} : ${seconds}`
    }, 1000)

    setTimeout(() => {
        clearInterval(interValid)
    }, loop)
}

function attachCountdown(list) {
    let future = new Date(list.deadline).getTime()
    CountDouwn(future, document.querySelector(`.item${list.id}`).querySelector('.countdown'))
}

function countLevel(deadline) {
    let currentTime = new Date()
    let deadlineTime = new Date(deadline)
    let remainTime = (deadlineTime - currentTime) / (1000 * 60 * 60)
    if (remainTime < 24 && remainTime >= 12) return 'Phải làm'
    if (remainTime < 12 && remainTime > 0) return 'Phải đi làm ngay'
    if (remainTime <= 0) return 'Over time'
    return 'Chill Chill'
}

function addTodoElement() {
    let addButton = document.querySelector('.add')
    addButton.onclick = (e) => {
        e.preventDefault()
        document.querySelector('.Add').classList.remove('active')

        let name = document.querySelector('#textInput').value
        let deadline = document.getElementById('timeInput').value
        let level = countLevel(deadline)

        if (name && deadline) {
            let newList = { name, deadline, level, checked: false }
            creatList(newList)
        }

        document.querySelector('#textInput').value = ''
        document.getElementById('timeInput').value = ''
    }
}

function filterTodos(e) {
    const todos = document.querySelectorAll('li')
    todos.forEach(function(child) {
        switch (e.target.value) {
            case 'all':
                child.style.display = 'flex'
                break
            case 'phailam':
                child.style.display = child.querySelector('.level').innerText === 'Phải làm' ? 'flex' : 'none'
                break
            case 'phaidilamngay':
                child.style.display = child.querySelector('.level').innerText === 'Phải đi làm ngay' ? 'flex' : 'none'
                break
            case 'chillchill':
                child.style.display = child.querySelector('.level').innerText === 'Chill Chill' ? 'flex' : 'none'
                break
        }
    })
}

function savedarkmode() {
    let isActive = darkMode.classList.contains('active')
    localStorage.setItem('DarkMode', JSON.stringify(isActive))
}

darkMode.addEventListener('click', () => {
    darkMode.classList.toggle('active')
    content.classList.toggle('night')
    savedarkmode()
})
