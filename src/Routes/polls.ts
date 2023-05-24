import { Router } from 'express';
import * as controller from '../Polls/index';
import _ from 'lodash';
import { convertBigIntToString } from '../../utils';

export const routes = Router();

// list
routes.get('/', async (req, res) => {
    const result = convertBigIntToString(await controller.list());
    return res.json(result);
});

// get
routes.get('/:id', async (req, res) => {
    const result = convertBigIntToString(await controller.view(parseInt(req.params.id)));
    return res.json(result);
});

// find
routes.post('/find', async(req, res) => {
    const result = convertBigIntToString(await controller.find(req.body));
    return res.json(result);
});

// create
routes.post('/', async(req, res) => {
    let data = req.body;
    const result = convertBigIntToString(await controller.create(data));

    return res.json({ success: true, data: result });
});

// update
// have to use POST to update (because multer does not support PUT)
routes.post('/update/:id', async(req, res) => {
    let data = req.body;

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

// remove (id)
routes.post('/remove/:id', async(req, res) => {
    await controller.remove(parseInt(req.params.id));

    return res.json({ success: true });
});