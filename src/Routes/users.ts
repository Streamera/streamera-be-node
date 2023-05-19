import { Router } from 'express';
import * as controller from '../Users/index';
import { contentUpload } from '../Upload';
import _ from 'lodash';
import fs from 'fs-extra';
import { checkAllowedMime } from '../../utils';

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

    await controller.update(parseInt(req.params.id), data);

    return res.json({ success: true });
});