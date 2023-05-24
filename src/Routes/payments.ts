import { Router } from 'express';
import * as controller from '../Payments/index';
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
    const result = await controller.create(data);

    return res.json({ success: true, data: convertBigIntToString(result) });
});

// update
// have to use POST to update (because multer does not support PUT)
routes.post('/update/:id', async(req, res) => {
    let data = req.body;
    await controller.update(parseInt(req.params.id), data);

    return res.json({ success: true });
});

routes.get('/history/:address', async(req, res) => {
    const data = await controller.history(req.params.address.toLowerCase());

    return res.json({ success: true, data: data });
});