const express = require('express');

const router = express.Router();

const FriendsCtrl = require('../controllers/friends');
const AuthHelper = require('../Helpers/AuthHelper');

router.post('/follow-user',AuthHelper.VerifyToken,FriendsCtrl.FollowUser);
router.post('/unfollow-user',AuthHelper.VerifyToken,FriendsCtrl.UnFollowUser);

module.exports = router;