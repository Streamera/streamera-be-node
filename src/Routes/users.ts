import { Router } from 'express';
import * as controller from '../Users/index';
import multer from 'multer';
import path from 'path';
import appRoot from 'app-root-path';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';
import fs from 'fs-extra';

export const routes = Router();

const contentPath = 'public/content';
const contentStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(appRoot.toString(), contentPath))
    },
    filename: function ( req, file, cb ) {
        //How could I get the new_file_name property sent from client here?
        const extension = path.extname(file.originalname);
        // const fileName = path.basename(file.originalname,extension);
        cb(null, `${uuidv4()}${extension}`);
    }
});
const contentUpload = multer({ storage: contentStorage });

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
routes.post('/', contentUpload.single('profile_picture'), async(req, res) => {
    let data = req.body;
    const result = await controller.create(data);

    return res.json({ success: true, data: result });
});

// update
// have to use POST to update (because multer does not support PUT)
routes.post('/update/:id', contentUpload.single('profile_picture'), async(req, res) => {
    let data = req.body;

    const whitelistMimes = ['image/jpeg', 'image/jpg', 'image/gif', 'image/png', 'image/webp', 'video/mp4', 'video/mpeg', 'video/quicktime'];

    const mime = req.file?.mimetype;

    // delete file if not in whitelist
    if (mime && !whitelistMimes.includes(mime)) {
        await fs.remove(req.file?.path!);
    }

    // assign profile_picture params if valid
    if (_.has(req, 'file')) {
        data.profile_picture = req.file?.filename;
    }

    await controller.update(parseInt(req.params.id), data);

    return res.json({ success: true });
});