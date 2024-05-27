const express = require("express")
const app = express()
const handlebars = require("express-handlebars").engine
const bodyParser = require("body-parser")
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app')
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore')

const serviceAccount = require('./chave-firebase.json')

initializeApp({
  credential: cert(serviceAccount)
})

const db = getFirestore()
app.engine("handlebars", handlebars({defaultLayout: "main"}))
app.set("view engine", "handlebars")
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.get("/", function(req, res){
    res.render("primeira_pagina")
})

app.get("/consulta", async function(req, res){
    try{
        var agendamentos = [];
        var snapshot = await db.collection('agendamentos').get()

        snapshot.forEach(doc => {
            var chave = doc.id;
            var data = doc.data();
            data.chave = chave;
            agendamentos.push(data);
        })

        res.render("consulta", {agendamentos: agendamentos})
    }catch(erro){
        console.log("Erro ao consultar documento: " + erro);
        res.redirect('/')
    }
})

app.get("/editar/:id", async function(req, res){
    
    try {
        const docRef = db.collection('agendamentos').doc(req.params.id);
        const doc = await docRef.get();
        if (!doc.exists) {
          console.log('No such document!');
          res.status(404).send("Documento não encontrado");
        } else {
          res.render("editar", { id: req.params.id, agendamento: doc.data() });
        }
      } catch (error) {
        console.error("Error getting document: ", error);
        res.status(500).send("Erro ao buscar documento");
      }

})

// app.route("/excluir/:id").get((req, res) => {
//     db.collection('agendamentos').doc(req.params.id).delete().then(() => {
//         console.log('Documento excluído com sucesso.');
//         res.redirect('/consulta');
//     }).catch((error) => {
//       console.error('Erro ao excluir o documento: ', error);
//       res.status(500).send('Erro ao excluir o documento.');
//     });
// });

app.get("/excluir/:id", async function (req, res) {
    try {
      await db.collection('agendamentos').doc(req.params.id).delete();
      console.log('Document successfully deleted');
      res.redirect('/consulta');
    } catch (error) {
      console.error("Error deleting document: ", error);
      res.status(500).send("Erro ao excluir documento");
    }
  });

app.post("/cadastrar", function(req, res){
    var result = db.collection('agendamentos').add({
        nome: req.body.nome,
        telefone: req.body.telefone,
        origem: req.body.origem,
        data_contato: req.body.data_contato,
        observacao: req.body.observacao
    }).then(function(){
        console.log('Documento inserido com sucesso');
        res.redirect('/')
    })
})

app.post("/atualizar", async function(req, res){
    
    try {
        const docRef = db.collection('agendamentos').doc(req.body.id).update({
          nome: req.body.nome,
          telefone: req.body.telefone,
          origem: req.body.origem,
          data_contato: req.body.data_contato,
          observacao: req.body.observacao
        });
        console.log('Document successfully updated');
        res.redirect('/consulta');
      } catch (error) {
        console.error("Error updating document: ", error);
        res.status(500).send("Erro ao atualizar documento" + error);
      }

})

app.listen(8081, function(){
    console.log("Servidor ativo!")
})