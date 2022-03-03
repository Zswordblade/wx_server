const { response } = require("express");
const express = require("express");
const router = express.Router();
const request = require('request')
let config = require('../server/util/config')
const home = require("./data/homehot")
const mysql = require('mysql')
const fs= require('fs') 
const path = require('path')
const multipart = require('connect-multiparty');
const multipartyMiddleware = multipart();
const data1=JSON.stringify(home.hot1)
config = Object.assign({},config.mp)

const conn = mysql.createConnection({
    user:'root',          //用户名
    password:'123456',	//密码
    host:'localhost',		//主机（默认都是local host）
    database:'db_bishe'       //数据库名
  })
  // 测试连接
  conn.connect(err=>{
    console.log(err,'如果为null 就是连接成功');
  })

router.get("/homehot",(req,res)=>{
    res.send(data1)
})
router.get('/getSession',(req,res)=>{
    let code = req.query.code;
    if(!code){
        res.json('code不能为空')
    }else{
        let url = `https://api.weixin.qq.com/sns/jscode2session?appid=${config.appId}&secret=${config.appSecret}&js_code=${code}&grant_type=authorization_code`
        request(url,(err,response,body)=>{
            if(!err&&response.statusCode == '200'){
                let data = JSON.parse(body)
                if(data&&!data.errcode){
                    res.json({data,code:200})
                }else {
                    res.json({msg:data.errmsg, code:data.errcode})
                }
            }
            else {
                res.json({err,code:10009})
            }
        })
    }
})
router.post('/uploadPicture', function(req, res){
    console.log(req.files)
    let oldFileName = req.files[0].filename
    let newFileName = './public/'+req.files[0].fieldname+'-'+ Date.now() + path.parse(req.files[0].originalname).ext
    fs.renameSync('./public/'+oldFileName,newFileName)
    res.send(newFileName)
});

router.post('/addGood',(req,res)=>{
    console.log(req.body)
    let {title,price,token,pic_url,sort} = req.body
    let sqlStr =  `INSERT INTO goods ( title, price, userID,pic_url,sort )VALUES('${title}',${price},'${token}','${pic_url}','${sort}')`
       //执行mysql 语句
    conn.query(sqlStr,(err)=>{
           if(err){
             res.json({msg:'false',err})
           }else{
             res.json({msg:'true'})
             console.log(err,'如果为null，sql语句执行成功')
           }
           
    })
})
//首页楼层数据
router.get("/home/floordata",(req,res)=>{
    let sql = `SELECT * FROM goods `
    conn.query(sql,(err,results)=>{
        res.send(results)
    })
})
//获取商品详情
router.get('/goodsDetail',(req,res)=>{
    const {id} = req.query
    let sql = `SELECT * FROM goods WHERE id=${id}`
    conn.query(sql,(err,results)=>{
        res.send(results)
    })
})
//收藏商品
router.get('/collectGoods',(req,res)=>{
    const {goodsid,token} = req.query
    let sqlStr =  `INSERT INTO favorites ( userID,goodsID )VALUES('${token}','${goodsid}')`
    //执行mysql 语句
    conn.query(sqlStr,(err)=>{
        if(err){
          res.json({msg:'false',err})
        }else{
          res.json({msg:'true'})
          console.log(err,'收藏商品成功')
        }
        
    })
})
// 获取收藏
router.get('/my/favoriGoods',(req,res)=>{
    const {token} = req.query
    let sql = `SELECT * FROM favorites f JOIN goods ON f.goodsID=goods.id WHERE f.userID='${token}'`
    conn.query(sql,(err,results)=>{
        console.log(err)
        res.send(results)
    })
})
//添加地址
router.post('/my/myAddress',(req,res)=>{
    console.log(req.body)
    let {name,id,phone,address} = req.body
    let sqlStr =  `INSERT INTO address ( user_name, user_id,phone,address )VALUES('${name}','${id}','${phone}','${address}')`
       //执行mysql 语句
    conn.query(sqlStr,(err)=>{
           if(err){
             res.json({msg:'false',err})
             console.log(err)
           }else{
             res.json({msg:'true'})
             console.log(err,'地址保存成功')
           }
           
    })
})
//获取地址
router.get('/getAddress',(req,res)=>{
    const {token} = req.query
    let sql = `SELECT * FROM address WHERE user_id='${token}'`
    conn.query(sql,(err,results)=>{
        console.log(err)
        res.send(results)
    })
})

module.exports = router;