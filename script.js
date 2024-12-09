// Configuração do Firebase - substituir pelas credenciais do seu projeto
const firebaseConfig = {
  apiKey: "SUA-CHAVE",
  authDomain: "SEU-PROJETO.firebaseapp.com",
  projectId: "SEU-PROJETO",
  storageBucket: "SEU-PROJETO.appspot.com",
  messagingSenderId: "NUMERO",
  appId: "APP-ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Elementos da interface
const selectedContainer = document.getElementById('selected-tags');
const unselectedContainer = document.getElementById('unselected-tags');
const addButton = document.getElementById('add-button');
const modal = document.getElementById('modal');
const confirmAddBtn = document.getElementById('confirm-add');
const cancelAddBtn = document.getElementById('cancel-add');
const newItemNameInput = document.getElementById('new-item-name');
const newItemCategorySelect = document.getElementById('new-item-category');

// Objetos para armazenar dados em memória
let categoriesMap = {}; // {categoryName: {color: '#hexcolor'}}
let itemsList = []; // {id, name, category: {name, color}, selected: bool}

// Carregar categorias
db.collection('categories').onSnapshot(snapshot => {
  categoriesMap = {};
  snapshot.forEach(doc => {
    const data = doc.data();
    categoriesMap[data.name] = {
      color: data.color
    };
  });
  atualizarCategoriasNoSelect();
  // Após ter categorias, carregamos itens
  carregarItens();
});

function carregarItens() {
  db.collection('items').onSnapshot(snapshot => {
    itemsList = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const categoria = categoriesMap[data.category] || {color: '#ccc'};
      itemsList.push({
        id: doc.id,
        name: data.name,
        category: {name: data.category, color: categoria.color},
        selected: data.selected
      });
    });
    renderizarItens();
  });
}

function renderizarItens() {
  // Ordenar itens:
  // 1. Selecionados primeiro, depois não selecionados
  // 2. Dentro de cada grupo, ordenar por nome da categoria (alfabética)
  // 3. Dentro da categoria, ordenar alfabeticamente por nome do item
  itemsList.sort((a, b) => {
    if (a.selected && !b.selected) return -1;
    if (!a.selected && b.selected) return 1;

    // ambos no mesmo grupo (selecionados ou não)
    if (a.category.name < b.category.name) return -1;
    if (a.category.name > b.category.name) return 1;

    // Mesma categoria
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });

  selectedContainer.innerHTML = '';
  unselectedContainer.innerHTML = '';

  itemsList.forEach(item => {
    const tag = document.createElement('span');
    tag.classList.add('tag');
    tag.textContent = item.name;

    // Aplicar estilos de cor dinamicamente
    // Se selecionado: fundo colorido = item.category.color, texto branco
    // Se não selecionado: fundo branco, border item.category.color, texto da cor
    if (item.selected) {
      tag.classList.add('selected');
      tag.style.backgroundColor = item.category.color;
    } else {
      tag.classList.add('unselected');
      tag.style.borderColor = item.category.color;
      tag.style.color = item.category.color;
    }

    tag.addEventListener('click', () => {
      // Alternar estado selected no Firestore
      db.collection('items').doc(item.id).update({
        selected: !item.selected
      });
    });

    if (item.selected) {
      selectedContainer.appendChild(tag);
    } else {
      unselectedContainer.appendChild(tag);
    }
  });
}

function atualizarCategoriasNoSelect() {
  newItemCategorySelect.innerHTML = '';
  const nomesCategorias = Object.keys(categoriesMap).sort();
  nomesCategorias.forEach(catName => {
    const opt = document.createElement('option');
    opt.value = catName;
    opt.textContent = catName;
    newItemCategorySelect.appendChild(opt);
  });
}

// Lidar com adicionar novo item
addButton.addEventListener('click', () => {
  modal.classList.remove('hidden');
  newItemNameInput.value = '';
  if (Object.keys(categoriesMap).length > 0) {
    newItemCategorySelect.selectedIndex = 0;
  }
});

cancelAddBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
});

confirmAddBtn.addEventListener('click', () => {
  const newItemName = newItemNameInput.value.trim();
  const newItemCategory = newItemCategorySelect.value;

  if (newItemName && newItemCategory && categoriesMap[newItemCategory]) {
    db.collection('items').add({
      name: newItemName,
      category: newItemCategory,
      selected: false
    }).then(() => {
      modal.classList.add('hidden');
    });
  }
});
