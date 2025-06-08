"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeholderComments = exports.placeholderEIPs = void 0;
var types_1 = require("@dsync/types");
var randomTitles = [
    "title 1",
    "title 2",
    "title 3",
    "title 4",
    "title 5",
    "title 6",
    "title 7",
    "title 8",
    "title 9",
    "title 10",
];
var randomDescriptions = [
    "description 1",
    "description 2",
    "description 3",
    "description 4",
    "description 5",
    "description 6",
    "description 7",
    "description 8",
    "description 9",
    "description 10",
];
var randomContents = [
    "# content 1",
    "# content 2",
    "# content 3",
    "# content 4",
    "# content 5",
    "# content 6",
    "# content 7",
    "# content 8",
    "# content 9",
    "# content 10",
];
var randomAuthors = [
    "author 1",
    "author 2",
    "author 3",
    "author 4",
    "author 5",
    "author 6",
    "author 7",
    "author 8",
    "author 9",
    "author 10",
];
var numEIPs = 100;
exports.placeholderEIPs = [];
var _loop_1 = function (i) {
    exports.placeholderEIPs.push({
        id: i,
        title: randomTitles[i % randomTitles.length],
        description: randomDescriptions[i % randomDescriptions.length],
        content: randomContents[i % randomContents.length],
        status: types_1.AllEIPStatusValues[i % types_1.AllEIPStatusValues.length],
        category: types_1.AllEIPCategoryValues[i % types_1.AllEIPCategoryValues.length],
        authors: (function () {
            var numAuthors = Math.floor(Math.random() * 3) + 1;
            var authors = [];
            for (var j = 0; j < numAuthors; j++) {
                authors.push(randomAuthors[Math.floor(Math.random() * randomAuthors.length)]);
            }
            return authors;
        })(),
        createdAt: new Date(Date.now() - i * 1000),
        updatedAt: new Date(Date.now() - i * 1000),
        requires: (function () {
            var numRequires = i % 10 === 0 ? Math.floor(Math.random() * 3) + 1 : 0;
            var requires = [];
            for (var j = 0; j < numRequires; j++) {
                requires.push(Math.floor(Math.random() * numEIPs) + 1);
            }
            return requires;
        })(),
        dbAddress: "orbitdb/".concat(i),
    });
};
for (var i = 1; i < numEIPs; i++) {
    _loop_1(i);
}
var randomCommenters = ["UserA", "UserB", "UserC", "UserD", "UserE"];
var randomCommentContents = [
    "# This is a great proposal",
    "# I agree with UserA",
    "# I have some concerns about section 2",
    "# Looking forward to the review",
    "# I have some concerns about section 2",
];
var numComments = 100;
exports.placeholderComments = [];
for (var i = 0; i < numComments; i++) {
    exports.placeholderComments.push({
        id: "comment-".concat(i),
        eipId: Math.floor(Math.random() * numEIPs) + 1,
        content: randomCommentContents[i % randomCommentContents.length],
        createdBy: randomCommenters[i % randomCommenters.length],
        createdAt: new Date(Date.now() - i * 1000),
        parentId: i % 2 === 0 ? null : "comment-".concat(Math.floor(Math.random() * (i - 1))),
    });
}
