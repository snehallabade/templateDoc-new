"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
var supabaseStorage_js_1 = require("./services/supabaseStorage.js");
var documentProcessor_js_1 = require("./services/documentProcessor.js");
var storage_js_1 = require("./services/storage.js");
function handler(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, templates, file, fileType, placeholders, fileName, _b, storageFile, uploadError, publicUrl, authHeader, token, user, template, error_1;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    // Enable CORS
                    res.setHeader('Access-Control-Allow-Credentials', 'true');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    if (req.method === 'OPTIONS') {
                        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
                        res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
                        return [2 /*return*/, res.status(200).json({ ok: true })];
                    }
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 14, , 15]);
                    _a = req.method;
                    switch (_a) {
                        case 'GET': return [3 /*break*/, 2];
                        case 'POST': return [3 /*break*/, 4];
                    }
                    return [3 /*break*/, 12];
                case 2: return [4 /*yield*/, storage_js_1.storage.getAllTemplates()];
                case 3:
                    templates = _d.sent();
                    return [2 /*return*/, res.status(200).json(templates)];
                case 4:
                    file = req.body;
                    fileType = ((_c = file.originalname) === null || _c === void 0 ? void 0 : _c.endsWith('.docx')) ? 'docx' : 'excel';
                    placeholders = [];
                    if (!(fileType === 'docx')) return [3 /*break*/, 6];
                    return [4 /*yield*/, documentProcessor_js_1.documentProcessor.extractPlaceholdersFromDocx(file.buffer)];
                case 5:
                    placeholders = _d.sent();
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, documentProcessor_js_1.documentProcessor.extractPlaceholdersFromExcel(file.buffer)];
                case 7:
                    placeholders = _d.sent();
                    _d.label = 8;
                case 8:
                    fileName = "".concat(Date.now(), "-").concat(file.originalname);
                    return [4 /*yield*/, supabaseStorage_js_1.supabase.storage
                            .from('templates')
                            .upload(fileName, file.buffer)];
                case 9:
                    _b = _d.sent(), storageFile = _b.data, uploadError = _b.error;
                    if (uploadError) {
                        throw uploadError;
                    }
                    publicUrl = supabaseStorage_js_1.supabase.storage
                        .from('templates')
                        .getPublicUrl(fileName).data.publicUrl;
                    authHeader = req.headers.authorization;
                    token = authHeader === null || authHeader === void 0 ? void 0 : authHeader.split(' ')[1];
                    return [4 /*yield*/, supabaseStorage_js_1.supabase.auth.getUser(token)];
                case 10:
                    user = (_d.sent()).data.user;
                    if (!(user === null || user === void 0 ? void 0 : user.id)) {
                        return [2 /*return*/, res.status(401).json({ error: 'Unauthorized' })];
                    }
                    return [4 /*yield*/, storage_js_1.storage.createTemplate({
                            name: file.originalname,
                            originalFileName: file.originalname,
                            fileType: fileType,
                            storageUrl: publicUrl,
                            storageId: fileName,
                            placeholders: placeholders,
                            user_id: user.id
                        })];
                case 11:
                    template = _d.sent();
                    return [2 /*return*/, res.status(200).json({ template: template, placeholders: placeholders, storageFile: storageFile })];
                case 12: return [2 /*return*/, res.status(405).json({ error: 'Method not allowed' })];
                case 13: return [3 /*break*/, 15];
                case 14:
                    error_1 = _d.sent();
                    console.error('API Error:', error_1);
                    return [2 /*return*/, res.status(500).json({ error: 'Internal Server Error' })];
                case 15: return [2 /*return*/];
            }
        });
    });
}
