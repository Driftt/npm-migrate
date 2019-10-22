const fs = require('graceful-fs')
const async = require('async')
const curry = require('lodash.curry')
const replaceInFiles = require('replace-in-files');

const updatePackageScopes = function (oldScope, newScope, folder, callback) {
    console.log('HI')
    if(oldScope !== undefined  && newScope !== undefined) {
        var options = {
            files: `${folder}/**`,
            from: new RegExp(oldScope, 'g'),  // string or regex
            to: newScope, // string or fn  (fn: carrying last argument - path to replaced file)
            saveOldFile: false // default
        };   
        replaceInFiles(options, (err) => {
            if (err) return callback(err);
            callback(null, folder)
        })
        .then(({ changedFiles, countOfMatchesByPaths }) => {
            console.log('Modified files:', changedFiles);
            console.log('Count of matches by paths:', countOfMatchesByPaths);
            console.log('was called with:', options);
        })
    }
    else {
        callback(null, folder)
    }
}

module.exports.updatePackageScope = function update (oldScope, newScope, folders) {

    let curried_updatePackageScopes = curry(updatePackageScopes)
    let series = folders.map((folder) => {
        console.log(folder)
        return updatePackageScopes(oldScope, newScope, folder)
    })

    return new Promise((resolve, reject) => {
        async.series(
            series,
            (err, results) => {
                if (err) return reject(err);

                resolve(results)
            })
    })
}



const updatePackageJson = function (newRegistry, folder, callback) {

    const packjson = folder + '/package.json'

    let packageJsonObject = require(packjson)
    packageJsonObject.publishConfig = { registry: newRegistry }

    fs.writeFile(packjson, JSON.stringify(packageJsonObject), (err) => {
        if (err) return callback(err);
        callback(null, folder)
    })
}



module.exports.updatePackage = function update (newRegistry, folders) {

    let curried_updatePackageJson = curry(updatePackageJson)
    let series = folders.map((folder) => curried_updatePackageJson(newRegistry, folder))

    return new Promise((resolve, reject) => {
        async.series(
            series,
            (err, results) => {
                if (err) return reject(err);

                resolve(results)
            })
    })
}

