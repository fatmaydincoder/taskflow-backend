//Express kütüphanesini projeme dahil ettim.
const express = require('express');

//Body Parser kütüphanesini dahil ettim. (Gelen verileri JSON veri formatında işleyebilmek adına.)
const bodyParser = require('body-parser');

//Uygulamamı başlattım.
const app = express();

//Sunucumun çalışacağı portu belirledim.
const PORT = 3000;

//Body Parser middleware'imi aktif ediyorum.
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

//Logger middleware'imi yazdım, her isteği konsola kaydettim.
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

//Görevleri bellekte tutabilmek için bir array oluşturdum.
let tasks = [];
let nextId = 1;

//Tüm görevlerimi listelemek için GET endpoint oluşturdum.
app.get('/tasks' , (req, res) => {
    res.json(tasks);
});

//Görevi görüntülemek için GET endpoint oluşturdum.
app.get('/tasks/:id' , (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
        return res.status(404).json({ error: 'Görev bulunamadı'});
    }
    res.json(task);
    });

//Görev güncellemek için PUT endpoit oluşturdum.
app.put('/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
        return res.status(404).json({ error: 'Görev bulunamadı' });
    }
    const { title, description, priority, assignee, status } = req.body;
    task.title = title || task.title;
    task.description = description || task.description;
    task.priority = priority || task.priority;
    task.assignee = assignee || task.assignee;
    task.status = status || task.status;
    res.json(task);
});

//Görev silmek için bir DELETE endpoint oluşturdum.
app.delete('/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const index = tasks.findIndex(t => t.id === taskId);
    if (index === -1) {
        return res.status(404).json({ error: 'Görev bulunamadı' });
    }
    const deletedTask = tasks.splice(index, 1);
    res.json(deletedTask[0]);
});

//Görevleri olası durumlarına göre filtrelemek için GET endpoint oluşturdum.
app.get('/tasks/status/:status' , (req, res) => {
    const status = req.params.status;
    const filteredTasks = tasks.filter(t => t.status === status); // ✅ doğru
    res.json(filteredTasks);
});

//Görevleri önceliğine göre filtrelemek için GET endpoint oluşturdum.
app.get('/tasks/priority/:priority', (req, res) => {
    const priority = req.params.priority;
    const filteredTasks = tasks.filter(t => t.priority === priority);
    res.json(filteredTasks);
});

//Görevleri aramak için GET endpoint oluşturdum.
app.get('/tasks/search/:keyword', (req, res) => {
    const keyword = req.params.keyword.toLowerCase();
    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(keyword) ||
        t.description.toLowerCase().includes(keyword)
    );
    res.json(filteredTasks);
});

//Görevleri sayfalama ile göstermek için GET endpoint oluşturdum.
app.get('/tasks/page/:page/limit/:limit', (req, res) => {
    const page = parseInt(req.params.page);
    const limit = parseInt(req.params.limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTasks = tasks.slice(startIndex, endIndex);
    res.json(paginatedTasks);
});

//Görevleri sıralamak için GET endpoint oluşturdum.
app.get('/tasks/sort/:field', (req, res) => {
    const field = req.params.field;
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a[field] < b[field]) return -1;
        if (a[field] > b[field]) return 1;
        return 0;
    });
    res.json(sortedTasks);
});

//Validation Middleware oluşturdum.
function validateTask(req, res, next) {
    const { title, description, priority, assignee } = req.body;
    if (!title || !description || !priority || !assignee) {
        return res.status(400).json({ error: 'Eksik alanlar var, lütfen tüm bilgileri girin' });
    }

    //Öncelik alanını sadece belirli değerlerle sınırladım
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
        return res.status(400).json({ error: 'Geçersiz öncelik değeri, low/medium/high olmalı' });
    }

    next(); 
}

//POST endpointime Validation Middleware ekledim.
app.post('/tasks', validateTask, (req, res) => {
    const { title, description, priority, assignee } = req.body;
    const newTask = {
        id: nextId++,
        title,
        description,
        priority,
        assignee,
        status: 'pending',
        createdAt: new Date()
    };
    tasks.push(newTask);
    res.status(201).json(newTask);
});

//Tamamlanan görevlerin sayısını raporlayabilmek için GET endpoint oluşturdum.
app.get('/reports/completed' , (req, res) => {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    res.json({ count: completedTasks.length, tasks: completedTasks });
});

//Bekleyen görevlerin sayısını raporlamak için GET endpoint oluşturdum.
app.get('/reports/pending' , (req, res) => {
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    res.json({ count: pendingTasks.length, tasks: pendingTasks});
});

//Genel özet raporu oluşturmak için GET endpoint oluşturdum.
app.get('/reports/summary' , (req, res) => {
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const pendingCount = tasks.filter(t => t.status === 'pending').length;
    const totalCount = tasks.length;

    res.json({
        total: totalCount,
        completed: completedCount,
        pending: pendingCount
    });
});

//Test için bir endpoit oluşturdum.
app.get('/', (req, res) => {
    res.send('Taskflow API çalışıyor!');
});

//Sunucumu başlatıyorum
app.listen(PORT, () => {
   console.log(`Server http://localhost:${PORT} üzerinde çalışıyor`);
});
