const transformationService =
    require("../services/transformationService");


function transformRow(req, res) {

    try {

        const {
            row,
            rules
        } = req.body;


        if (!row || !rules) {

            return res.status(400).json({

                success: false,

                message:
                    "row and rules are required"
            });
        }


        const result =
            transformationService
                .applyTransformations(
                    row,
                    rules
                );


        res.json({

            success: true,

            data: result
        });


    } catch (error) {

        console.error(error);


        res.status(500).json({

            success: false,

            message: error.message
        });
    }
}


module.exports = {
    transformRow
};