const Joi = require ('joi')
const HttpStatus =require('http-status-codes');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModels');
const Helpers = require('../Helpers/helpers');
const dbConfig = require('../config/secret');



// creation  user 


module.exports = {
   async CreateUser(req,res){
        const schema = Joi.object().keys({
            username:Joi.string()
            .min(3).max(25).required(),

            email:Joi.string()
            .email()
            .required(),

            password: Joi.string()
            .min(5)
            .required()
        }); 

        const {error ,value} = Joi.validate(req.body,schema);
        console.log(value);
        if (error && error.details){
            return res.status(HttpStatus.BAD_REQUEST)
            .json({msg:error.details});
        }
        // verfier si email exist oui ou non

        const userEmail = await User.findOne({email: Helpers.lowerCase(req.body.email)
        });
        if(userEmail){
            return res.status(HttpStatus.CONFLICT)
            .json({  
                message: 'email already exist'
            });

        }

        // verifier name exist ou non
        const userName = await User.findOne({
            username: Helpers.firstUpper(req.body.username)
        });
        if(userName){
            return res
            .status(HttpStatus.CONFLICT)
            .json({message: 'Username already exist'});
        
        }


        // pour crypter password  && save data in base
        return bcrypt.hash(value.password, 10, (err,hash) =>{
            if(err){
                return res
                .status(HttpStatus.BAD_REQUEST)
                .json({message:'Error hashing password'});

            }
            const body = {
                username : Helpers.firstUpper(value.username),
                email : Helpers.lowerCase(value.email),
                password: hash
            };
            User.create(body)
            .then(user => {
                const token = jwt.sign({data : user},dbConfig.secret,{
                    expiresIn: 120    
                });
                res.cookie('auth',token);
                res
                .status(HttpStatus.CREATED)
                .json({message:'user created successfully', user, token});
                
            })
            .catch(err => {
                res
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .json({message:'Error occured'});
            });
        } );
    },

    async LoginUser(req , res){
        if(!req.body.username || !req.body.password){
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({message:'No empty fields allowd'});

        }

        await User.findOne({username:Helpers.firstUpper(req.body.username)}).then(user =>{
            if(!user){
                return res.status(HttpStatus.NOT_FOUND).json({message: 'username not found'});
            }
            return bcrypt.compare(req.body.password, user.password).then((result)=>{
                if(!result){
                    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({message:'password is incorrect'});

                }
                const token = jwt.sign({data:user},dbConfig.secret,{
                    expiresIn: 10000
                });
                res.cookie('auth',token);
                return res.status(HttpStatus.OK).json({message: 'login successful', user,token});
            }  
            )
        })
        .catch(err=>{
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({message:'ERROR occured'});
        })
    }
};

