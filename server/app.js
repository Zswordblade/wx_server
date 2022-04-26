const express = require("express")
const app = express()
const router = require("./router")
const bodyParser = require("body-parser");
const multer = require('multer')

const http = require('http').Server(app)
// const io = require("socket.io")(http)


// io.on('connection', socket => {
//     socket.emit('success', '连接到服务器')
//     socket.on('disconnect', () => {
//         io.emit('quit', socket.id)
//     })
// })


app.use(multer({ dest: './public/' }).any())// 通过配置multer的dest属性， 将文件储存在项目下的tmp文件中
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use('/public', express.static('public'));
app.use("/api",router)

http.listen(3200,() =>{
    console.log("server run at port http://127.0.0.1:3200/");
})
