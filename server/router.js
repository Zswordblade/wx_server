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
    console.log(err,'左边为null 就是连接成功');
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
// 记录用户信息
router.post('/setUserInfo',(req,res)=>{
    console.log(req.body)
    let { name, avr_url, userID } = req.body
    console.log(`新用户的name:${name}，头像地址：${avr_url},userID:${userID}`)
    if  (userID&&name&&avr_url) {
        let sqlStr = `SELECT * FROM user WHERE userID='${userID}'`//先判断是否是新用户
        conn.query(sqlStr, (err, results) => {
            if (err) {
                res.json({msg:'false',err})
            } else if (!results.length) {
                sqlStr = `INSERT INTO user (userID, name, avr_url) VALUES('${userID}', '${name}', '${avr_url}')`
                conn.query(sqlStr,(err) => {
                    if (err) {
                        res.json({msg:'false',err})
                    } else 
                        res.json({msg:'true'})
                })
            } else 
                res.json({msg:'true'})
        })
    } else 
        res.json({err:'没传openid'})
})
//添加商品
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
//修改商品信息
router.post('/updateGoods',(req, res) => {
    console.log(req.body)
    let {id,title,price,pic_url,sort} = req.body 
    console.log(pic_url)
    let sqlStr = `UPDATE goods SET title='${title}',price='${price}', pic_url='${pic_url}', sort='${sort}' WHERE id = '${id}'`
    conn.query(sqlStr, (err) => {
        if (err) {
            res.json({msg:'false', err})
            console.log(err)
        } else {
            res.json({msg:'true'})
        }
    })
})
//首页楼层数据
router.get("/home/floordata",(req,res)=>{
    const pageNum = req.query.pageNum * 8
    console.log('pageNum:' + pageNum +' '+ 'sort:' + req.query.sort)
    let sql = `SELECT * FROM goods WHERE selled = '0' AND audit_status = '1' ORDER BY id LIMIT 8 OFFSET ${pageNum}`
    if (req.query.sort) {
        sql = `SELECT * FROM goods WHERE selled = '0' AND audit_status = '1' AND sort = '${req.query.sort}' ORDER BY id LIMIT 8 OFFSET ${pageNum}`
    }
    conn.query(sql,(err,results)=>{
        if(err) {
            console.log(err)
            res.send({msg:'false',err})
        } else {
            res.send({msg:'true',results})
        }
    })
})
//获取商品详情
router.get('/goodsDetail',(req,res)=>{
    const {id} = req.query
    let sql = `SELECT * FROM goods g LEFT JOIN user u ON g.userID=u.userID WHERE g.id=${id}`
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
//取消收藏
router.get('/unCollectGoods',(req,res)=>{
    const {goodsid,token} = req.query
    console.log(`goodsid:${goodsid}  token:${token}`)
    let sqlStr =  `DELETE FROM favorites WHERE userID = '${token}' AND goodsID = '${goodsid}'`
    //执行mysql 语句
    conn.query(sqlStr,(err)=>{
        if(err){
          res.json({msg:'false',err})
          console.log(err)
        }else{
          res.json({msg:'true'})
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
//获取用户个人的商品
router.get('/my/userGoods',(req, res) => {
    const { token, pageNum } = req.query
    console.log('获取用户个人的商品--' + token + ' ' + pageNum)
    let sql = `SELECT * FROM goods WHERE goods.userID='${token}' ORDER BY id LIMIT 8 OFFSET ${pageNum*8}`
    conn.query(sql, (err, results) => {
        if (err) {
            res.send({msg:'false',err})
            console.log(err)
        } else {
            res.send({msg:'true', results})
        }
    })
})
//添加地址
router.post('/my/myAddress',(req,res)=>{
    console.log(req.body)
    let {name,id,phone,address} = req.body
    let sqlStr =  `INSERT INTO address ( user_name, user_id, phone, address )VALUES('${name}','${id}','${phone}','${address}')`
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
//////////////////////
//订单
/////////////////////
// 创建订单
router.post('/makeOrder',(req,res)=>{
    // console.log(req.body)
    let {customer,order_status,goodsID} = req.body
    let sqlStr =  `INSERT INTO orders ( customer,order_status,goodsID)VALUES('${customer}','${order_status}','${goodsID}')`
    let sqlStr1 = `UPDATE goods SET selled='1' WHERE id=${goodsID}`
       //执行mysql 语句
    conn.query(sqlStr,(err)=>{
           if(err){
             res.json({msg:'false',err})
             console.log(err)
           }else{
             conn.query(sqlStr1,(err)=>{
                 if(err){
                    res.json({msg:'false',err})
                    console.log(err)
                 } else {
                    res.json({msg:'true'})
                 }
             })
           }      
    })
})
//获取订单
router.get('/home/getOrder',(req,res)=>{
    const {token} = req.query
    let sql = `SELECT * FROM (orders o LEFT JOIN goods g ON o.goodsID=g.id) LEFT JOIN user ON user.userID=g.userID WHERE o.customer='${token}'`
    conn.query(sql,(err,results)=>{
        if(err)
            console.log(err)
        res.send(results)
    })
})
//用户评价
router.post('/estimate',(req,res)=>{
    console.log(req.body)
    let {estimate,orderID,customer,seller,rate,datetime} = req.body
    let sqlStr =  `INSERT INTO evaluate ( estimate,orderID,customer,seller,rate,create_time )VALUES('${estimate}','${orderID}','${customer}','${seller}','${rate}','${datetime}')`
    conn.query(sqlStr,(err)=>{
        if(err){
            res.json({msg:'false',err})
        }else{
            sqlStr = `UPDATE orders SET estimate_status = '1' WHERE id = '${orderID}'`
            conn.query(sqlStr,(errs) => {
            if(errs){
                res.json({msg:'false',errs})
            }else{
                res.json({msg:'true'})
            }
            })
        }  
    })
})
router.get('/getEstimate',(req,res)=>{
    const {seller_token} = req.query
    let sql = `SELECT * FROM evaluate LEFT JOIN user on user.userID = evaluate.customer WHERE evaluate.seller='${seller_token}'`
    conn.query(sql,(err,results) => {
        if(err) {
            res.send({err,msg:'false'})
            console.log(err)
        } else {
            res.send({results,msg:'true'})
        }
    })
})
///////////后台//////////
// 管理员登录
router.post('/user/login',(req,res)=>{
    console.log(req.body)
    let {username,password} = req.body
    let sql = `SELECT * FROM manager WHERE name='${username}' AND password='${password}'`
    conn.query(sql,(err,results)=>{
        if(err) {
            console.log(err)
            res.send({msg:'false',err})
        } else if (results.length<=0)
            res.send({msg:'false',err:'账号密码有误'})
        else
            res.send({msg:'true',token:'runaway'})
    })
})
// 后台商品列表
router.get('/admin/getGoods',(req,res)=>{
    const {pageNum} = req.query
    console.log('请求页' + pageNum)
    let sql = `SELECT * FROM goods g LEFT JOIN user ON user.userID=g.userID ORDER BY g.id DESC LIMIT 5 OFFSET ${pageNum*5-5}`
    conn.query(sql,(err,result1)=>{
        if(err) {
            res.send({err,msg:'false'})
            console.log(err)
        } else {
            sql = `SELECT * FROM goods`
            conn.query(sql, (err, result2) => {
                if (err) {
                    res.send({err,msg:'false'})
                    console.log(err)
                } else {
                    res.send({ msg:'true', rows:result1, count: result2.length||0 })
                }
            })
        }
    })
})
// 后台商品上下架
router.get('/admin/checkGoods',(req,res)=>{
    const {audit_status, id} = req.query
    console.log(req.query)
    let sql = `UPDATE goods SET  audit_status='${audit_status}' where id='${id}'`
    conn.query(sql,(err)=>{
        if(err){
            console.log(err)
            res.send({msg:'false',err})
        } else {
            res.send({msg:'true'})
        }
    })
})
//后台订单
router.get('/admin/getOrder',(req,res)=>{
    const {pageNum} = req.query
    let sql = `SELECT * FROM orders o LEFT JOIN user u ON o.customer=u.userID ORDER BY o.id DESC LIMIT 5 OFFSET ${pageNum*5-5}`
    conn.query(sql,(err,results1)=>{
        if(err) {
            console.log(err)
            res.send({msg:'false',err})
        } else {
            sql = `SELECT * FROM orders o LEFT JOIN user u ON o.customer=u.userID`
            conn.query(sql, (err, results2) => {
                if (err) {
                    console.log(err)
                    res.send({msg:'false',err})
                } else {
                    res.send({ rows:results1, msg:'true', count:results2.length||0 })
                }
            })
        }
    })
})
// 获取评价
router.get('/admin/getFeedBack',(req,res)=>{
    const {pageNum} = req.query
    let sql = `SELECT * FROM evaluate e LEFT JOIN user u ON e.customer=u.name`
    conn.query(sql, (err, results1) => {
        if(err) {
            console.log(err)
            res.send({msg:'false', err})
        } else {
            sql = `SELECT * FROM evaluate e LEFT JOIN user u ON e.customer=u.name ORDER BY e.eva_id DESC LIMIT 5 OFFSET ${pageNum*5-5}`
            conn.query(sql, (err, results2) => {
                if (err) {
                    console.log(err)
                    res.send({msg:'false', err})
                } else {
                    res.send({ msg: 'true', rows: results2, count: results1.length || 0 })
                }
            })
        }
    })
})
// 删除评价
router.get('/admin/deleEstimate',(req,res)=>{
    const {id} = req.query
    let sql = `DELETE FROM evaluate WHERE eva_id=${id}`
    conn.query(sql,(err)=>{
        if(err) {
            console.log(err)
            res.send({msg:'false',err})
        } else {
            res.send({msg:'true'})
        }
    })
})
//获取用户表
router.get('/admin/getUser',(req,res)=>{
    let sql = `SELECT * FROM user`
    conn.query(sql,(err,result)=>{
        if(err) {
            console.log(err)
            res.send({msg:'false',err})
        } else {
            res.send({msg:'true',rows:result})
        }
    })
})
//禁用用户
router.get('/admin/banUser',(req,res)=>{
    const {id,banned} = req.query
    let sql = `UPDATE user SET banned=${banned} WHERE u_id=${id}`
    conn.query(sql,(err)=>{
        if(err) {
            console.log(err)
            res.send({msg:'false',err})
        } else 
            res.send({msg:'true'})
    })
})
module.exports = router;