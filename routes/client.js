'use strict';
const router = require('express').Router();
const config = require("../config");
const db = require("../models/db");
const Promise = require('bluebird');

/**
 * Client-side routes; mounted at / (root)
 */

/* Home Page */
router.get('/', (req, res) => {
    res.render('home', {session: req.session});
});

/* FAQ Page */
router.get('/faq', (req, res) => {
    res.render('faq', {session:req.session});
});

/* Registration page */
router.get('/user/register', (req, res) => {
    if (!req.session.token) {
        res.render('register');
        return;
    }
    res.redirect('/user/account');
  });

/* Login page */
router.get('/user/login', (req, res) => {
    if (!req.session.token) {
        res.render('login');
        return;
    }
    res.redirect('/user/account');
});

/* Account Profile */
router.get('/user/account', db.User.clientAuth, (req, res) => {
    res.render('account', {session: req.session});
});

/* Documents store */
router.get('/documents', db.User.clientAuth, (req, res) => {
   db.Doc.getAllDocs(req, (docs) => {
        res.render('documents', {docs: docs.data, session: req.session});
    });
});

/* Document Editor */
router.get('/documents/:docId', db.User.clientAuth, db.Doc.clientCollab,
        (req, res) => {
    res.render('editor', {
            documentId: req.params.docId,
            session: req.session
    });
});

/* Demo Document Editor */
router.get('/demo', (req, res) => {
    const newTestDoc = new db.Doc({
        docName: config.testDoc.docName,
        owners: [config.testDoc.owner],
        owners_emails: [config.testDoc.owner_email],
        contents: config.testDoc.contents
    });
    newTestDoc
        .save()
        .then((result) => {
            const uri = '/demo/' + result._id;
            res.redirect(uri);
        }).catch((err) => {
            console.log(err);
            res.redirect('/');
        });
});

/* Demo document editor shareable link for existing demo docs */
router.get('/demo/:docId', (req, res) => {
    db.Doc
        .findOne({
            $and: [{_id: req.params.docId}, 
                    {owners_emails: config.testDoc.owner},
                    {owners: config.testDoc.owner}]
        }).then((result) => {
            if (!result) {
                return Promise.reject(new Error("Document not found"));
            }
            res.render('demo_editor', {documentId: req.params.docId});
        }).catch((err) => {
            console.log(err);
            res.redirect('/');
        });
});

module.exports = router;
