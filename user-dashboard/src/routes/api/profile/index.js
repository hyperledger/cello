import { Router } from 'express'
import Profile from '../../../modules/profile'

const router = new Router()

router.get("/:apikey", function(req, res) {
    const profile = new Profile(req.params.apikey);
    profile.load().then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.json(err);
    });
});
router.post("/:apikey/update", function(req, res) {
    const profile = new Profile(req.params.apikey);
    profile.update(req.body.name,
        req.body.email,
        req.body.bio,
        req.body.url,
        req.body.location)
        .then(function(result) {
            res.json(result);
        }).catch(function(err) {
        res.json(err);
    });
});

export default router
