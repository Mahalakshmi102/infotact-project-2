const transformations =
    require("../utils/transformationFunctions");


class TransformationService {

    constructor() {

        this.transformations = transformations;
    }


    applyTransformation(
        row,
        column,
        operation,
        options = {}
    ) {

        if (!row.hasOwnProperty(column)) {

            throw new Error(
                `Column '${column}' not found`
            );
        }


        const value = row[column];


        switch (operation) {

            case "uppercase":

                row[column] =
                    this.transformations.uppercase(value);

                break;


            case "lowercase":

                row[column] =
                    this.transformations.lowercase(value);

                break;


            case "capitalize":

                row[column] =
                    this.transformations.capitalize(value);

                break;


            case "trim":

                row[column] =
                    this.transformations.trim(value);

                break;


            case "toNumber":

                row[column] =
                    this.transformations.toNumber(value);

                break;


            case "toBoolean":

                row[column] =
                    this.transformations.toBoolean(value);

                break;


            case "replace":

                row[column] =
                    this.transformations.replace(
                        value,
                        options.search,
                        options.replacement
                    );

                break;


            case "add":

                row[column] =
                    this.transformations.add(
                        value,
                        options.amount
                    );

                break;


            default:

                throw new Error(
                    `Unknown transformation: ${operation}`
                );
        }


        return row;
    }


    applyTransformations(row, rules) {

        let transformedRow = {
            ...row
        };


        for (const rule of rules) {

            transformedRow =
                this.applyTransformation(
                    transformedRow,
                    rule.column,
                    rule.operation,
                    rule.options || {}
                );
        }


        return transformedRow;
    }
}


module.exports =
    new TransformationService();