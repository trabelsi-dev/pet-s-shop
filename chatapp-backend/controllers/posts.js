//lina bech ki ta3mil post tsajil fil base mte3na w les coordonnées mta3 ili a3mil post
const Joi = require('joi')
const HttpStatus = require('http-status-codes');
const Post = require('../models/postModels');
const User = require('../models/userModels');

module.exports = {
    AddPost(req, res) {
        const schema = Joi.object().keys({
            post: Joi.string().required()
        });

        const { error } = Joi.validate(req.body, schema);
        if (error && error.details) {
            return res.status(HttpStatus.BAD_REQUEST)
                .json({ msg: error.details });
        }

        const body = {
            user: req.user._id,
            username: req.user.username,
            post: req.body.post,
            created: new Date()
        };
        //kol user fil base mte3na 3ana tous les post mte3ou w bi date zeda 
        Post.create(body)
            .then(async post => {
                await User.update({
                    _id: req.user._id
                }, {
                    $push: {
                        posts: {
                            postId: post._id,
                            post: req.body.post,
                            created: new Date()
                        }
                    }
                }
                );


                res.status(HttpStatus.OK).json({ message: 'post created', post });
            })
            .catch(err => {
                res
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .json({ message: 'Error occured' });
            });
    },

    async GetAllPosts(req, res) {
        try {
            const posts = await Post.find({})
                .populate('user')
                .sort({ created: -1 });


            const top = await Post.find({ totalLikes: { $gte: 2 } })
                .populate('user')
                .sort({ created: -1 });

            return res.status(HttpStatus.OK).json({ message: 'all posts', posts, top });

        } catch (err) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'error occured' });


        }

    },

    async AddLike(req, res) {
        const postId = req.body._id;
        await Post.update(
            {
                _id: postId,
                'likes.username': { $ne: req.user.username }
            },
            {
                $push: {
                    likes: {
                        username: req.user.username
                    }
                },
                $inc: { totalLikes: 1 },
            }
        )

            .then(() => {
                res.status(HttpStatus.Ok).json({ message: 'You liked the post' });
            })
            .catch(

            );

    },
    async AddComment(req, res) {


        const postId = req.body.postId;
        await Post.update(
            {
                _id: postId,

            },
            {
                $push: {
                    comments: {
                        userId: req.user._id,
                        username: req.user.username,
                        comment: req.body.comment,
                        createdAt: new Date()
                    }
                }

            }
        )

            .then(() => {
                res.status(HttpStatus.Ok).json({ message: 'Comment added to post' });
            })
            .catch(

            );

    },
    // bech nista3malha fil postRouter
    async GetPost(req, res) {
        await Post.findOne({ _id: req.params.id })
            .populate('user')
            .populate('comments.userId')
            .then(post => {
                res.status(HttpStatus.OK).json({ message: 'Post found ', post });
            })
            .catch(err =>
                res
                    .status(HttpStatus.NOT_FOUND)
                    .json({ message: 'post not found ', post })
            );
    }


};
