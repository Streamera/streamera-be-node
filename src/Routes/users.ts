import { Router } from 'express';
import * as controller from '../Users/index';
import { contentUpload } from '../Upload';
import _ from 'lodash';
import fs from 'fs-extra';
import { checkAllowedMime } from '../../utils';
import { VerifyData } from '../Users/types';

export const routes = Router();

// list
routes.get('/', async (req, res) => {
    return res.json(await controller.list());
});

// get
routes.get('/:id', async (req, res) => {
    return res.json(await controller.view(parseInt(req.params.id)));
});

// find
routes.post('/find', async (req, res) => {
    return res.json(await controller.find(req.body));
});

// create
routes.post('/', async(req, res) => {
    let data = req.body;
    try {
        const result = await controller.create(data);
        return res.json({ success: true, data: result });
    }

    catch {
        return res.status(500).send({ success: false, message: "die die die" });
    }

});

// update
// have to use POST to update (because multer does not support PUT)
routes.post('/update/:id', contentUpload.single('profile_picture'), async(req, res) => {
    let data = req.body;
    const mime = req.file?.mimetype;

    // delete file if not in whitelist
    if (mime && !checkAllowedMime(mime, ['image'])) {
        await fs.remove(req.file?.path!);
    }

    // assign profile_picture params if valid
    if (_.has(req, 'file')) {
        data.profile_picture = req.file?.filename;
    }

    try {
        await controller.update(parseInt(req.params.id), data);
        return res.json({ success: true });
    }

    catch(e: any) {
        if(e.message === "Unauthorized") {
            return res.status(401).send("Unauthorized");
        }

        return res.status(500);
    }
});

// check if user exist and signature empty?
// if empty update it with the current signature
routes.post('/verify', async(req, res) => {
    let data: VerifyData = req.body;
    try {
        const result = await controller.verify(data.wallet, data.signature);
        return res.json({ success: true, data: result });
    }

    catch {
        return res.status(500).send({ success: false, message: "die die die" });
    }

});