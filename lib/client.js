window.__ModuleLoader__.load({id:"dsh-decision-router",factory:(require)=>{const module={exports:{}};const exports=module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.jsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react5 = __toESM(require("react"), 1);

// src/client/style.js
var css = `
.dar{height:100%;overflow:auto;background:var(--background,#f8fafc);color:var(--foreground,#17202e);font-family:inherit}.dar *{box-sizing:border-box}.dar-shell{max-width:1160px;margin:0 auto;padding:38px 36px 20px}.dar button,.dar select,.dar textarea{font:inherit}.dar button{cursor:pointer}.dar button:disabled,.dar select:disabled{cursor:not-allowed;opacity:.55}.dar button:focus-visible,.dar select:focus-visible,.dar textarea:focus-visible{outline:2px solid #3d7af5;outline-offset:3px}.dar h1,.dar h2,.dar h3,.dar p{margin:0}.dar-header{display:flex;justify-content:space-between;align-items:center;gap:24px;margin-bottom:30px}.dar-kicker{display:flex;align-items:center;gap:9px;color:#547398;font-size:10px;font-weight:650;letter-spacing:1.4px;margin-bottom:12px}.dar h1{font-size:29px;letter-spacing:-.7px;font-weight:650;line-height:1.3}.dar-header p{font-size:13px;color:#7b8492;margin-top:10px}.dar-header-actions{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:12px}.dar-status{display:flex;align-items:center;gap:7px;font-size:11px;white-space:nowrap;color:#848991}.dar-status i{width:6px;height:6px;border-radius:50%;background:#b58c4c}.dar-status.is-ready i{background:#26a776;box-shadow:0 0 0 3px #26a77614}.dar-status.is-ready{color:#43806b}.dar-button{border:1px solid #dde2e9;border-radius:8px;padding:8px 12px;background:transparent;color:inherit;font-size:12px!important}.dar-stats{display:grid;grid-template-columns:repeat(4,1fr);padding:21px 0;border-top:1px solid #e4e8ef;border-bottom:1px solid #e4e8ef;margin-bottom:26px;gap:20px}.dar-stats>div+div{border-left:1px solid #e4e8ef;padding-left:25px}.dar-stats span{display:block;font-size:11px;color:#828b98}.dar-stats strong{display:block;font-size:26px;font-weight:550;margin-top:9px;line-height:1.2}.dar-stats small{font-size:11px;color:#8c94a0;margin-left:7px;font-weight:400}.dar-stats .dar-stat-name{font-size:21px;line-height:1.5}.dar-config{border:1px solid #e2e7ef;border-radius:13px;background:#fff;padding:22px 24px;margin-bottom:16px}.dar-control-heading,.dar-control-row{display:flex;justify-content:space-between;align-items:center;gap:20px}.dar h2{font-size:15px;font-weight:600}.dar-control-heading p{color:#8a93a0;font-size:11px;margin-top:6px}.dar-session-label,.dar-pin{display:flex;gap:10px;align-items:center;color:#7e8795;font-size:11px}.dar select{border:1px solid #e2e7ee;background:#fff;border-radius:7px;color:#4c5664;padding:7px 25px 7px 10px;font-size:12px;max-width:220px}.dar-control-row{margin-top:22px}.dar-segment{display:inline-flex;background:#f1f4f8;border:1px solid #e9edf3;padding:3px;border-radius:9px;gap:3px}.dar-segment button{border:none;padding:8px 18px;border-radius:6px;background:none;color:#818c9a;font-size:12px}.dar-segment button[aria-pressed=true]{background:#fff;color:#316edf;box-shadow:0 1px 4px #21344e12}.dar-mode-help{font-size:11px;color:#8b93a1;margin-top:14px!important}.dar-candidates{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px}.dar-model{border:1px solid #e4e9f0;border-radius:11px;background:#fff;padding:18px}.dar-model-title{display:flex;align-items:center;gap:9px}.dar-model-number{font-size:10px;border-radius:6px;padding:5px;color:#4386e3;background:#edf5ff}.dar-model-standard .dar-model-number{background:#f0efff;color:#7d6adb}.dar-model-strong .dar-model-number{background:#fff6e9;color:#b58b4c}.dar-model h3{font-size:13px;font-weight:550}.dar-model-title>span:last-child{margin-left:auto;font-size:10px;color:#8a95a5}.dar-model p{font-size:11px;color:#8b94a1;line-height:1.7;margin-top:13px}.dar-model-footer{display:flex;justify-content:space-between;border-top:1px solid #f0f2f6;margin-top:15px;padding-top:11px;color:#a1a8b4;font-size:10px}.dar-model code{color:#64758b;font-family:ui-monospace,monospace;font-size:11px}.dar-columns{display:grid;grid-template-columns:1.2fr 1fr;gap:18px}.dar-card{border:1px solid #e1e7ef;border-radius:13px;padding:23px;background:#fff;min-width:0}.dar-card-heading{display:flex;justify-content:space-between;align-items:center;gap:12px}.dar-tag{font-size:10px;color:#688ab3;background:#eef5fd;padding:4px 7px;border-radius:5px;white-space:nowrap}.dar-subtitle{font-size:11px;color:#9098a5;line-height:1.8;margin-top:9px!important}.dar-samples{display:flex;gap:7px;flex-wrap:wrap;margin:21px 0 14px}.dar-samples button{border:1px solid #e4eaf2;background:#f9fbfd;color:#778595;font-size:11px;padding:6px 10px;border-radius:6px}.dar-samples button:hover{color:#377de7;border-color:#b7d2fa}.dar-input-label{display:block;color:#8691a0;font-size:11px;margin-bottom:7px}.dar textarea{resize:vertical;min-height:130px;max-height:320px;width:100%;border:1px solid #dfe6ef;background:#fafcff;border-radius:9px;line-height:1.85;color:#43536b;font-size:12px;padding:13px 14px}.dar-form-bottom{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:15px}.dar-form-bottom>span{font-size:10px;color:#9ca4af;line-height:1.7}.dar-primary{white-space:nowrap;background:#377ee8;color:#fff;border:1px solid #377ee8;border-radius:8px;padding:10px 14px;font-size:12px!important;box-shadow:0 2px 6px #367ce71c}.dar-primary:hover{background:#2d6dd0}.dar-result{margin-top:23px;border-top:1px solid #e9edf3;padding-top:20px}.dar-result-top{display:flex;align-items:center;justify-content:space-between;gap:10px}.dar-eyebrow{font-size:10px;color:#7d8b9d}.dar-result h3{font-size:19px;font-weight:550;margin-top:7px}.dar-result h3 span{font-size:10px;color:#8797aa;margin-left:12px;font-weight:400}.dar-result>p{color:#758295;font-size:11px;margin-top:10px}.dar-probabilities{margin-top:17px;display:grid;gap:8px}.dar-probabilities>div{display:flex;align-items:center;gap:10px;font-size:10px;color:#7d889a}.dar-probabilities span{width:38px}.dar-probabilities b{width:30px;text-align:right;font-weight:400;font-variant-numeric:tabular-nums}.dar-track{height:5px;flex:1;background:#eff3f8;border-radius:5px;overflow:hidden}.dar-track i{height:100%;display:block;background:#87b7f7;border-radius:5px}.dar-result-meta{display:flex;gap:12px;flex-wrap:wrap;font-size:10px;color:#9ba3af;margin-top:14px}.dar-link{border:0;background:none;color:#5088d1;padding:0;margin-top:17px;font-size:11px!important}.dar-records ol{list-style:none;padding:0;margin:14px 0 0;max-height:415px;overflow:auto}.dar-records li{padding:14px 0;border-bottom:1px solid #eef1f5}.dar-records li:last-child{border-bottom:0}.dar-record-head,.dar-record-foot{display:flex;align-items:center;justify-content:space-between;gap:10px}.dar-record-head strong{font-size:12px;font-weight:500}.dar-record-head>span{font-size:10px;color:#9aa5b3}.dar-records li p{font-size:11px;color:#8791a0;margin-top:7px}.dar-record-foot{font-size:10px;color:#a1a9b5;margin-top:10px;justify-content:flex-start}.dar-record-foot time{margin-left:auto}.dar-muted{font-size:10px;color:#9da7b4}.dar-empty{display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;color:#a5b0bf;min-height:220px}.dar-empty p{margin-top:15px;font-size:12px;color:#7d8c9f}.dar-empty span{font-size:11px;line-height:1.7;margin-top:7px}.dar-error{padding:12px;border:1px solid #edcfcf;background:#fff8f8;color:#b46565;font-size:12px;border-radius:8px;margin-bottom:18px}.dar-footer{text-align:center;font-size:10px;color:#a7b0bd;margin-top:23px}.dar-header-button{font:inherit;display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border:1px solid #bcd2ef66;background:#edf5ff55;color:#6388b5;border-radius:7px;font-size:11px;cursor:pointer;white-space:nowrap}
@media(max-width:950px){.dar-shell{padding:25px 22px}.dar-header{align-items:flex-start}.dar-header-actions{max-width:140px}.dar-columns{grid-template-columns:1fr}.dar-control-heading{align-items:flex-start}.dar-session-label{flex-direction:column;align-items:flex-start;gap:5px}}
@media(max-width:620px){.dar-shell{padding:22px 15px}.dar-header{gap:10px}.dar h1{font-size:24px}.dar-header p{max-width:200px;line-height:1.6}.dar-candidates{grid-template-columns:1fr}.dar-model p{margin-top:8px}.dar-model-footer{margin-top:9px}.dar-stats{grid-template-columns:repeat(2,1fr);gap:18px}.dar-stats>div+div{padding-left:0;border:0}.dar-stats strong{font-size:22px}.dar-config,.dar-card{padding:18px}.dar-control-row{flex-direction:column;align-items:flex-start;gap:16px}.dar-control-heading{flex-direction:column;gap:13px}.dar-session-label{flex-direction:row;align-items:center}.dar select{max-width:185px}.dar-segment button{padding:8px 14px}.dar-form-bottom{flex-wrap:wrap}.dar-form-bottom .dar-primary{margin-left:auto}.dar-header-button span{max-width:130px;overflow:hidden;text-overflow:ellipsis}}
.dar{--dar-border:var(--dsw-alias-border-l1,#e2e7ef);--dar-muted:var(--dsw-alias-label-tertiary,#7b8492);color:var(--dsw-alias-label-primary,#17202e)}
.dar input{font:inherit}.dar input:focus-visible{outline:2px solid var(--dsw-focus-ring-color,#3d7af5);outline-offset:2px}.dar input:disabled{opacity:.55}.dar h3,.dar code,.dar strong{overflow-wrap:anywhere}
.dar-tabs{display:flex;gap:22px;border-bottom:1px solid var(--dar-border);margin-bottom:24px}.dar-tabs button{background:none;border:0;border-bottom:2px solid transparent;padding:10px 0;font-size:13px;color:var(--dar-muted)}.dar-tabs button[aria-selected=true]{color:var(--dsw-alias-label-primary,#17202e);border-bottom-color:var(--dsw-alias-label-primary,#17202e)}
.dar-overview-heading{margin:22px 0 12px}.dar-candidates{grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr))}.dar-model-footer{gap:12px}.dar-model-footer span{overflow-wrap:anywhere;text-align:right}.dar-model p{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.dar-record-foot{flex-wrap:wrap}.dar-stat-name{overflow:hidden;text-overflow:ellipsis}
.dar-settings-subpage{height:auto;overflow:visible;background:transparent;padding:4px 0 20px}.dar-settings-subpage h1{font-size:22px}.dar-settings-lead{color:var(--dar-muted);font-size:13px;margin:10px 0 26px!important}.dar-model-settings{container-type:inline-size}.dar-settings-intro{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:20px}.dar-settings-intro p{color:var(--dar-muted);font-size:12px;line-height:1.8;margin-top:8px}.dar-settings-fields{border:0;padding:0;margin:0;min-width:0}.dar-settings-options{border-bottom:1px solid var(--dar-border);padding:0 0 20px;margin-bottom:18px}.dar-switch{display:flex;align-items:flex-start;gap:10px;font-size:13px;cursor:pointer}.dar-switch input{width:16px;height:16px;accent-color:var(--dsw-alias-state-business-primary,#377ee8);margin:2px 0}.dar-switch small{display:block;color:var(--dar-muted);font-size:11px;margin-top:6px;line-height:1.8}.dar-provider-help{display:flex;align-items:center;gap:18px;margin-bottom:12px}.dar-provider-help p{font-size:12px;line-height:1.8;color:var(--dar-muted);flex:1}.dar-provider-help button{flex-shrink:0}.dar-inline-note{font-size:11px;line-height:1.8;color:var(--dar-muted);margin:12px 0 16px!important}.dar-route-editors{display:grid;gap:16px}.dar-route-editor{border:1px solid var(--dar-border);border-radius:var(--dsw-radius-lg,12px);padding:20px;background:var(--dsw-alias-bg-module-platform,white)}.dar-route-title{display:flex;align-items:center;gap:10px;margin-bottom:18px}.dar-route-title h3{font-size:14px;font-weight:600}.dar-remove{margin-left:auto;background:none;border:0;padding:4px;font-size:11px!important;color:var(--dar-muted)}.dar-remove:hover:not(:disabled){color:var(--dsw-alias-state-error-primary,#b34e4e)}.dar-route-fields{display:grid;grid-template-columns:1fr 1fr 1.4fr .8fr;gap:14px}.dar-route-fields>label,.dar-description-fields>label{display:flex;flex-direction:column;gap:8px;font-size:11px;color:var(--dar-muted);min-width:0}.dar-route-fields input{width:100%;height:34px;min-width:0;border:1px solid var(--dar-border);border-radius:var(--dsw-radius-sm,7px);background:transparent;padding:7px 10px;color:var(--dsw-alias-label-primary,#263344);font-size:12px}.dar-description-fields{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px}.dar-description-fields textarea{min-height:86px;max-height:220px;background:transparent;color:var(--dsw-alias-label-secondary,#556170);border-color:var(--dar-border);font-size:12px;line-height:1.7;padding:10px 12px}.dar-route-controls{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-top:18px}.dar-route-controls>label{display:flex;gap:10px;align-items:center;font-size:11px;color:var(--dar-muted)}.dar-save-row{display:flex;justify-content:space-between;align-items:center;gap:16px;border-top:1px solid var(--dar-border);margin-top:20px;padding:18px 0 6px}.dar-save-row>span{font-size:11px;color:var(--dar-muted)}.dar-save-row>div{display:flex;gap:10px;flex-shrink:0}.dar-success{padding:12px 14px;border:1px solid #a9ceba66;background:#edf9f455;color:var(--dsw-alias-label-primary,#366a52);font-size:12px;border-radius:8px;margin-bottom:18px;line-height:1.8}.dar-inline-error{font-size:11px;color:var(--dsw-alias-state-error-primary,#b34e4e);margin-top:12px!important}.dar-button{border-color:var(--dar-border);color:var(--dsw-alias-label-secondary,#526075)}.dar-tag{background:var(--dsw-alias-interactive-bg-hover,#eef3f9);color:var(--dsw-alias-label-secondary,#60748e)}
.dar-picker{display:inline-flex;min-width:0;max-width:100%}.dar-picker-trigger{font:inherit!important;font-size:13px!important;color:var(--dsw-alias-label-secondary,#526075);display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0;max-width:100%;width:100%;height:32px;padding:4px 8px;border:0;border-radius:var(--dsw-radius-sm,6px);background:transparent;cursor:pointer;text-align:left}.dar-picker-trigger:hover:not(:disabled),.dar-picker-trigger[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover,#eef0f3)}.dar-picker-trigger>span{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;min-width:0}.dar-picker-trigger svg{flex-shrink:0;color:var(--dsw-alias-label-caption,#87909a);transition:transform .12s}.dar-picker-trigger svg.is-open{transform:rotate(180deg)}.dar-route-fields .dar-picker{width:100%}.dar-route-fields .dar-picker-trigger{height:34px;border:1px solid var(--dar-border);padding:6px 10px;font-size:12px!important}.dar-session-label .dar-picker{max-width:230px}.dar-pin .dar-picker{max-width:230px;min-width:150px}
.dar-picker-menu{position:fixed;z-index:1100;display:flex;flex-direction:column;max-height:min(350px,calc(100vh - 24px));padding:4px;border:0;box-shadow:var(--dsw-elevation-prominent,0 8px 32px #18243826);--dsw-elevation-stroke-color:var(--dsw-alias-border-l1,#e2e7ef);color:var(--dsw-alias-label-primary,#17202e);font-family:inherit;overflow:hidden}.dar-picker-search{display:flex;align-items:center;gap:8px;flex-shrink:0;padding:7px;color:var(--dsw-alias-label-caption,#8a929f);border-bottom:1px solid var(--dsw-alias-border-l1,#e2e7ef);margin-bottom:4px}.dar-picker-search input{font:inherit;font-size:12px;color:var(--dsw-alias-label-primary,#17202e);background:transparent;border:0;outline:none;padding:2px 0;width:100%;min-width:0}.dar-picker-search input::placeholder{color:var(--dsw-alias-label-caption,#8a929f)}.dar-picker-options{overflow-y:auto;min-height:0;overscroll-behavior:contain}.dar-picker-options>button{display:flex;align-items:center;gap:10px;width:100%;min-height:34px;box-sizing:border-box;padding:7px 8px;border:0;border-radius:var(--dsw-radius-md,8px);background:transparent;color:inherit;text-align:left;cursor:pointer;font:inherit;font-size:13px;outline:none}.dar-picker-options>button:hover:not(:disabled),.dar-picker-options>button:focus-visible{background:var(--dsw-alias-interactive-bg-hover,#eef0f3)}.dar-picker-options>button:disabled{color:var(--dsw-alias-label-dimmed,#a5acb6);cursor:default}.dar-picker-copy{display:flex;flex:1;flex-direction:column;gap:2px;min-width:0}.dar-picker-copy>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:20px}.dar-picker-copy small{color:var(--dsw-alias-label-caption,#8a929f);font-size:11px;overflow-wrap:anywhere;line-height:16px}.dar-picker-check{display:grid;place-items:center;flex:0 0 14px}.dar-picker-empty{font-size:12px;color:var(--dsw-alias-label-caption,#8a929f);padding:10px 8px;margin:0}
.dar-decision-settings{border:1px solid var(--dar-border);border-radius:var(--dsw-radius-lg,12px);padding:18px 20px;margin-bottom:20px;background:var(--dsw-alias-bg-module-platform,white)}.dar-decision-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.dar-decision-heading p{font-size:12px;line-height:1.8;color:var(--dar-muted);margin-top:7px}.dar-decision-choice{display:flex;align-items:flex-end;gap:20px;flex-wrap:wrap;margin-top:18px}.dar-decision-choice>label{display:flex;flex-direction:column;gap:8px;min-width:220px;max-width:100%;font-size:11px;color:var(--dar-muted)}.dar-decision-choice .dar-picker{width:100%}.dar-decision-choice .dar-picker-trigger{height:34px;border:1px solid var(--dar-border);padding:6px 10px;font-size:12px!important}.dar-decision-choice>.dar-status{min-height:34px;white-space:normal;line-height:1.6}.dar-decision-warning{border:1px solid var(--dar-border);border-left:3px solid var(--dsw-alias-state-warning-primary,#bb9458);background:var(--dsw-alias-interactive-bg-hover,#f6f7f9);padding:12px 14px;border-radius:var(--dsw-radius-sm,7px);font-size:12px;line-height:1.8;color:var(--dsw-alias-label-secondary,#556170);margin-top:12px}.dar-decision-warning p+p{margin-top:6px}.dar-decision-warning code{display:inline-block;max-width:100%;padding:0 5px;margin:0 3px;border-radius:4px;background:var(--dsw-alias-bg-module-platform,white);font-size:11px;overflow-wrap:anywhere}
.dar-record-table-wrap{overflow-x:auto;margin-top:16px}.dar-record-table{width:100%;min-width:780px;border-collapse:collapse;text-align:left;font-size:11px;line-height:1.6}.dar-record-table th{font-size:10px;font-weight:500;color:var(--dar-muted);padding:9px 12px;border-bottom:1px solid var(--dar-border);white-space:nowrap}.dar-record-table td{padding:11px 12px;border-bottom:1px solid var(--dar-border);color:var(--dsw-alias-label-secondary,#526075);vertical-align:middle}.dar-record-table th:first-child,.dar-record-table td:first-child{padding-left:0}.dar-record-table th:last-child,.dar-record-table td:last-child{padding-right:0;text-align:right}.dar-record-table tbody tr:last-child td{border-bottom:0}.dar-record-table tbody tr:hover{background:var(--dsw-alias-interactive-bg-hover,#f6f8fb)}.dar-record-table time,.dar-record-elapsed{font-variant-numeric:tabular-nums;white-space:nowrap}.dar-record-table td:nth-child(3){overflow-wrap:anywhere;max-width:220px}.dar-record-table td:nth-child(4){white-space:nowrap}.dar-record-table small{display:block;font-size:10px;color:var(--dar-muted);margin-top:2px}.dar-record-session{display:block;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary,#17202e)}.dar-session-settings{margin-top:26px;background:var(--dsw-alias-bg-module-platform,#fff);border-color:var(--dar-border)}.dar-records{background:var(--dsw-alias-bg-module-platform,#fff);border-color:var(--dar-border)}
.dar-mode-setting{padding:0 0 22px;margin-bottom:22px;border-bottom:1px solid var(--dar-border)}.dar-mode-setting-row{display:flex;align-items:center;justify-content:space-between;gap:20px}.dar-mode-setting-row p{font-size:11px;color:var(--dar-muted);line-height:1.8;margin-top:6px}.dar-mode-setting .dar-segment{flex-shrink:0}.dar-mode-setting .dar-mode-help{color:var(--dar-muted);line-height:1.8}
.dar-sidebar-setting{display:flex;align-items:center;justify-content:space-between;gap:20px}.dar-sidebar-setting p{font-size:11px;color:var(--dar-muted);line-height:1.8;margin-top:6px}.dar-sidebar-setting .dar-picker{min-width:145px}.dar-cloud-text,.dar-status.is-cloud{color:var(--dsw-alias-state-error-primary,#c02f2f)!important}.dar-status.is-cloud i{background:#cf3838}.dar-cloud-warning{border:2px solid #dc4545;border-radius:10px;padding:16px 18px;background:var(--dsw-alias-state-error-bg,#fff1f1);color:var(--dsw-alias-state-error-primary,#b62323);font-size:13px;line-height:1.8;margin-top:16px}.dar-cloud-warning strong{display:block;font-size:15px;font-weight:700}.dar-cloud-warning p{margin:9px 0 0!important}.dar-cloud-warning code{font-size:12px;overflow-wrap:anywhere}.dar-cloud-fields{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px}.dar-cloud-fields label{display:flex;flex-direction:column;gap:8px;font-size:11px;color:var(--dar-muted)}.dar-cloud-fields label:first-child{grid-column:1 / -1}.dar-cloud-fields input{font:inherit;width:100%;min-width:0;height:36px;padding:7px 10px;border:1px solid var(--dar-border);border-radius:7px;background:transparent;color:var(--dsw-alias-label-primary,#263344);font-size:12px}.dar-dialog-actions{display:flex;justify-content:flex-end;align-items:center;flex-wrap:wrap;gap:10px}.dar-dialog-actions button{font:inherit;cursor:pointer}.dar-dialog-actions button:disabled{opacity:.55;cursor:not-allowed}.dar-danger-button{border:1px solid #b52c2c;background:#c73535;color:white;border-radius:8px;padding:9px 14px;font-size:12px!important}.dar-danger-button:hover{background:#ac2929}
.dar-mode-setting{padding-bottom:16px;margin-bottom:18px}.dar-mode-setting-row,.dar-sidebar-setting{flex-direction:row;align-items:center;gap:14px}.dar-mode-setting-row .dar-picker,.dar-sidebar-setting .dar-picker{min-width:0;flex:0 0 auto}.dar-mode-setting .dar-mode-help{margin-top:8px!important}.dar-settings-options{padding-bottom:16px;margin-bottom:18px}.dar-decision-settings{padding:14px 16px;margin-bottom:18px}.dar-decision-heading{align-items:center}.dar-decision-choice{margin-top:10px;gap:12px;align-items:center}.dar-decision-choice>.dar-picker{width:auto;max-width:100%}.dar-decision-choice .dar-picker-trigger{border:0;padding:4px 8px;height:30px;font-size:13px!important}.dar-decision-choice>.dar-status{min-height:0;font-size:10px}.dar-decision-hint{font-size:11px;color:var(--dar-muted);line-height:1.7;margin-top:7px!important}
@container(max-width:750px){.dar-route-fields{grid-template-columns:1fr 1fr}.dar-description-fields{grid-template-columns:1fr}.dar-provider-help{align-items:flex-start}.dar-save-row{flex-wrap:wrap}.dar-save-row>div{margin-left:auto}}
@container(max-width:440px){.dar-route-fields,.dar-cloud-fields{grid-template-columns:1fr}.dar-provider-help,.dar-route-controls{flex-direction:column;align-items:flex-start}.dar-route-editor{padding:16px}.dar-route-controls>label{flex-wrap:wrap}.dar-save-row>div{flex-wrap:wrap;justify-content:flex-end}}
.dar-route-editor.is-readonly{padding:14px 16px}.dar-route-editor.is-readonly .dar-route-title{margin-bottom:8px}.dar-route-actions{display:flex;align-items:center;gap:12px;margin-left:auto;flex-shrink:0}.dar-route-edit,.dar-route-actions .dar-remove{border:0;background:transparent;font:inherit;font-size:11px!important;padding:4px;color:var(--dar-muted);margin-left:0}.dar-route-edit:hover{color:var(--dsw-alias-state-business-primary,#377ee8)}.dar-route-model-line{font-size:11px;line-height:1.7;color:var(--dsw-alias-label-secondary,#526075);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dar-route-description{font-size:11px;line-height:1.7;color:var(--dar-muted);margin-top:5px!important;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.dar-dialog-copy{font-size:13px;color:var(--dsw-alias-label-secondary,#526075);line-height:1.8;margin:0}.dar-dialog-copy+.dar-dialog-copy{margin-top:10px}
`;

// src/client/model-settings.jsx
var import_react4 = __toESM(require("react"), 1);
var import_dsh_client_ui_primitives2 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/picker.jsx
var import_react = __toESM(require("react"), 1);
var import_react_dom = require("react-dom");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
function Picker({ label, value, options, onChange, disabled, searchable = false }) {
  const [open, setOpen] = (0, import_react.useState)(false);
  const [query, setQuery] = (0, import_react.useState)("");
  const [position, setPosition] = (0, import_react.useState)(null);
  const trigger = (0, import_react.useRef)(null);
  const panel = (0, import_react.useRef)(null);
  const search = (0, import_react.useRef)(null);
  const id = (0, import_react.useId)();
  const selected = options.find((option) => option.value === value);
  const filtered = options.filter((option) => `${option.label} ${option.description ?? ""} ${option.searchText ?? ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  function close(focus = true) {
    setOpen(false);
    if (focus) trigger.current?.focus();
  }
  function choose(option) {
    if (option.disabled) return;
    onChange(option.value);
    close();
  }
  (0, import_react.useLayoutEffect)(() => {
    if (!open) return;
    const place = () => {
      const menu = panel.current;
      if (!menu || !trigger.current) return;
      const box = trigger.current.getBoundingClientRect();
      menu.style.width = "max-content";
      const width = Math.ceil(menu.getBoundingClientRect().width);
      menu.style.width = `${width}px`;
      const height = menu.getBoundingClientRect().height;
      const below = window.innerHeight - box.bottom - 12;
      const top = below >= height || below >= box.top - 12 ? box.bottom + 4 : box.top - height - 4;
      const next = { width, left: Math.max(12, Math.min(box.left, window.innerWidth - width - 12)), top: Math.max(12, Math.min(top, window.innerHeight - height - 12)) };
      setPosition((previous) => previous && Object.keys(next).every((key) => previous[key] === next[key]) ? previous : next);
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, query, options, searchable]);
  (0, import_react.useEffect)(() => {
    if (!open) return;
    const outside = (event) => {
      if (!panel.current?.contains(event.target) && !trigger.current?.contains(event.target)) close(false);
    };
    document.addEventListener("pointerdown", outside);
    (search.current ?? panel.current?.querySelector('[aria-selected="true"]:not(:disabled)') ?? panel.current?.querySelector('[role="option"]:not(:disabled)'))?.focus();
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  (0, import_react.useEffect)(() => {
    if (disabled) setOpen(false);
  }, [disabled]);
  function keys(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key === "Tab") {
      close(false);
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    if (event.target === search.current && ["Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const rows = [...panel.current.querySelectorAll('[role="option"]:not(:disabled)')];
    const index = rows.indexOf(document.activeElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? rows.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length;
    rows[next]?.focus();
  }
  return /* @__PURE__ */ import_react.default.createElement("span", { className: "dar-picker" }, /* @__PURE__ */ import_react.default.createElement("button", { ref: trigger, type: "button", className: "dar-picker-trigger", "aria-label": label, "aria-description": `\u5F53\u524D\uFF1A${selected?.label ?? value ?? "\u672A\u9009\u62E9"}`, "aria-haspopup": "listbox", "aria-expanded": open, "aria-controls": open ? `${id}-list` : void 0, disabled, title: selected?.label ?? value, onClick: () => {
    setQuery("");
    setOpen(!open);
  }, onKeyDown: (event) => {
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      setQuery("");
      setOpen(true);
    }
  } }, /* @__PURE__ */ import_react.default.createElement("span", null, selected?.label ?? value ?? "\u8BF7\u9009\u62E9"), /* @__PURE__ */ import_react.default.createElement("svg", { width: "14", height: "14", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", className: open ? "is-open" : "" }, /* @__PURE__ */ import_react.default.createElement("path", { d: "m4 6 4 4 4-4", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }))), open && (0, import_react_dom.createPortal)(/* @__PURE__ */ import_react.default.createElement(import_dsh_client_ui_primitives.MenuSurface, { ref: panel, className: "dar-picker-menu", style: { boxSizing: "border-box", width: "max-content", minWidth: searchable ? "min(20ch, calc(100vw - 24px))" : 0, maxWidth: "min(440px, calc(100vw - 24px))", ...position ?? { visibility: "hidden" } }, onKeyDown: keys }, searchable && /* @__PURE__ */ import_react.default.createElement("div", { className: "dar-picker-search" }, /* @__PURE__ */ import_react.default.createElement("svg", { width: "15", height: "15", viewBox: "0 0 20 20", fill: "none", "aria-hidden": "true" }, /* @__PURE__ */ import_react.default.createElement("circle", { cx: "8.5", cy: "8.5", r: "5.5", stroke: "currentColor", strokeWidth: "1.5" }), /* @__PURE__ */ import_react.default.createElement("path", { d: "m13 13 4 4", stroke: "currentColor", strokeWidth: "1.5" })), /* @__PURE__ */ import_react.default.createElement("input", { ref: search, "aria-label": `\u641C\u7D22${label}`, placeholder: "\u641C\u7D22\u6A21\u578B\u6216\u540D\u79F0\u2026", value: query, onChange: (event) => setQuery(event.target.value) })), /* @__PURE__ */ import_react.default.createElement("div", { className: "dar-picker-options", id: `${id}-list`, role: "listbox", "aria-label": label }, filtered.map((option) => /* @__PURE__ */ import_react.default.createElement("button", { type: "button", role: "option", "aria-selected": option.value === value, disabled: option.disabled, key: option.value, onClick: () => choose(option) }, /* @__PURE__ */ import_react.default.createElement("span", { className: "dar-picker-copy" }, /* @__PURE__ */ import_react.default.createElement("span", null, option.label), option.description && /* @__PURE__ */ import_react.default.createElement("small", null, option.description)), /* @__PURE__ */ import_react.default.createElement("span", { className: "dar-picker-check" }, option.value === value && /* @__PURE__ */ import_react.default.createElement("svg", { width: "14", height: "14", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true" }, /* @__PURE__ */ import_react.default.createElement("path", { d: "m3 8 3 3 7-7", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }))))), !filtered.length && /* @__PURE__ */ import_react.default.createElement("p", { className: "dar-picker-empty" }, "\u6CA1\u6709\u5339\u914D\u7684\u9009\u9879"))), trigger.current?.closest('[role="dialog"]') ?? document.body));
}

// src/display.js
var efforts = { default: "\u6A21\u578B\u9ED8\u8BA4", none: "\u5173\u95ED", off: "\u5173\u95ED", minimal: "\u6700\u4F4E", low: "\u4F4E", medium: "\u4E2D", high: "\u9AD8", xhigh: "\u6781\u9AD8", max: "\u6700\u9AD8", ultra: "\u8D85\u9AD8", auto: "\u81EA\u52A8" };
var fixtures = { fast: "\u8F7B\u91CF\u6267\u884C\u7AEF", standard: "\u5E38\u89C4\u6267\u884C\u7AEF", strong: "\u5F3A\u80FD\u529B\u6267\u884C\u7AEF" };
function effortLabel(value, name) {
  if (!value) return "\u6A21\u578B\u9ED8\u8BA4";
  if (name && /[\u3400-\u9fff]/.test(name)) return name;
  return efforts[value.toLowerCase()] ?? name ?? value;
}
function modelLabel(provider, model, name) {
  if (provider === "dsh-auto-router" && model === "auto") return "\u81EA\u52A8";
  return provider === "local-fixture" && fixtures[model] || name || model || "\u7B49\u5F85\u4EFB\u52A1";
}
var reasons = {
  "system-one": "\u51B3\u7B56\u6A21\u578B\u81EA\u52A8\u9009\u62E9",
  "manual-pin": "\u624B\u52A8\u6307\u5B9A",
  "low-confidence": "\u7F6E\u4FE1\u5EA6\u4E0D\u8DB3\uFF0C\u5DF2\u56DE\u9000",
  "decision-timeout": "\u51B3\u7B56\u8D85\u65F6\uFF0C\u5DF2\u56DE\u9000",
  "decision-unavailable": "\u51B3\u7B56\u670D\u52A1\u672A\u8FDE\u63A5\uFF0C\u5DF2\u56DE\u9000",
  "state-too-long": "\u6587\u672C\u8FC7\u957F\uFF0C\u5DF2\u56DE\u9000",
  "decision-input-truncated": "\u8F93\u5165\u88AB\u622A\u65AD\uFF0C\u5DF2\u56DE\u9000",
  "non-text-input": "\u4FDD\u7559\u5F53\u524D\u591A\u6A21\u6001\u8BBE\u7F6E",
  "fallback-unavailable": "\u56DE\u9000\u6A21\u578B\u4E0D\u53EF\u7528",
  "manual-pin-unavailable": "\u6307\u5B9A\u6A21\u578B\u4E0D\u53EF\u7528",
  "invalid-choice": "\u51B3\u7B56\u8FD4\u56DE\u4E86\u65E0\u6548\u9009\u9879\uFF0C\u5DF2\u56DE\u9000",
  "invalid-probabilities": "\u51B3\u7B56\u6982\u7387\u65E0\u6548\uFF0C\u5DF2\u56DE\u9000",
  "decision-http-error": "\u51B3\u7B56\u670D\u52A1\u54CD\u5E94\u5F02\u5E38\uFF0C\u5DF2\u56DE\u9000",
  "decision-response-too-large": "\u51B3\u7B56\u54CD\u5E94\u8FC7\u957F\uFF0C\u5DF2\u56DE\u9000",
  "no-user-text": "\u6CA1\u6709\u53EF\u7528\u4E8E\u9009\u6A21\u7684\u6587\u672C\uFF0C\u5DF2\u56DE\u9000",
  "insufficient-candidates": "\u53EF\u7528\u6863\u4F4D\u4E0D\u8DB3\uFF0C\u5DF2\u56DE\u9000",
  "decision-error": "\u51B3\u7B56\u53D1\u751F\u5F02\u5E38\uFF0C\u5DF2\u56DE\u9000",
  "decision-model-not-installed": "\u672C\u5730\u51B3\u7B56\u6A21\u578B\u672A\u5B89\u88C5\uFF0C\u5DF2\u56DE\u9000",
  "decision-model-unavailable": "\u672C\u5730\u51B3\u7B56\u6A21\u578B\u4E0D\u53EF\u7528\uFF0C\u5DF2\u56DE\u9000",
  "decision-auth-error": "\u51B3\u7B56 API \u8BA4\u8BC1\u5931\u8D25\uFF0C\u5DF2\u56DE\u9000"
};
var reasonLabel = (reason) => reasons[reason] ?? "\u672C\u6B21\u672A\u80FD\u5B8C\u6210\u81EA\u52A8\u9009\u62E9";
function decisionModelLabel(model) {
  if (!model || model === "unknown") return "\u672A\u8BB0\u5F55";
  const id = model.toLowerCase().split("/").at(-1);
  return { laya: "Laya", "laya-multilingual": "Laya", "d1-3b": "d1-3B", "d1-omni-600m": "d1-omni-600M", "systemone-api": "System One API\uFF08\u4E91\u7AEF\uFF09" }[id] ?? model;
}
function decisionModelStatus(service, id) {
  if (id === "systemone-api") return { name: "System One API\uFF08\u4E91\u7AEF\uFF09", ready: false, text: "\u4E91\u7AEF\u51B3\u7B56 \xB7 \u6570\u636E\u5C06\u53D1\u9001\u81F3\u63D0\u4F9B\u5546" };
  const model = service?.models?.find((model2) => model2.id === id);
  const name = model?.label ?? model?.name ?? decisionModelLabel(id);
  if (!service) return { name, ready: false, installed: void 0, text: `${name} \xB7 \u6B63\u5728\u8BFB\u53D6\u672C\u5730\u72B6\u6001` };
  if (!service.ready) return { name, ready: false, installed: model?.installed, text: `${name} \xB7 \u672C\u5730\u670D\u52A1\u672A\u8FDE\u63A5` };
  if (service.loading === id) return { name, ready: false, installed: model?.installed, text: `${name} \xB7 \u6B63\u5728\u52A0\u8F7D` };
  if (model?.installed === false) return { name, ready: false, installed: false, text: `${name} \xB7 \u672A\u5B89\u88C5` };
  if (service.model === id) return { name, ready: true, installed: model?.installed, text: `${name} \xB7 \u5DF2\u52A0\u8F7D` };
  return { name, ready: model?.installed === true, installed: model?.installed, text: `${name} \xB7 ${model?.installed === true ? "\u5DF2\u5B89\u88C5\uFF0C\u6309\u9700\u52A0\u8F7D" : "\u5B89\u88C5\u72B6\u6001\u5F85\u786E\u8BA4"}` };
}

// src/decision-models.js
var DECISION_MODELS = Object.freeze([
  Object.freeze({ id: "laya", label: "Laya", experimental: false }),
  Object.freeze({ id: "d1-3b", label: "d1-3B", experimental: false }),
  Object.freeze({ id: "d1-omni-600m", label: "d1-omni-600M", experimental: true })
]);

// src/cloud-config.js
var CLOUD_DECISION_MODEL = "systemone-api";
var DEFAULT_CLOUD_ENDPOINT = "https://api.typesafe.ai/v1/systemone";
var DEFAULT_CLOUD_MODEL = "jev-latest";

// src/client/unsaved-guard.js
var import_react2 = require("react");
var SETTINGS_PANEL = '[role="dialog"][data-shortcut-modal="settings"]';
var MODAL_LAYERS = '[role="dialog"][aria-modal="true"], [role="menu"]';
var shortcutSources = /* @__PURE__ */ new WeakMap();
function installUnsavedGuardShortcuts(ctx) {
  ctx.effect(() => {
    const source = ctx.shortcuts.catalog;
    shortcutSources.set(document, source);
    return () => {
      if (shortcutSources.get(document) === source) shortcutSources.delete(document);
    };
  });
}
function isSettingsShortcut(event, document2) {
  const row = shortcutSources.get(document2)?.getSnapshot().find((item) => item.id === "settings.open");
  const binding = row?.binding;
  if (!binding || binding.secondCode !== void 0 || !row.aria || row.issue != null || row.conflicts?.length) return false;
  const modifiers = new Set(binding.modifiers);
  return event.code === binding.code && modifiers.has("control") === event.ctrlKey && modifiers.has("alt") === event.altKey && modifiers.has("shift") === event.shiftKey && modifiers.has("meta") === event.metaKey;
}
function useUnsavedGuard({ dirty, busy = false, onSave, onClose }) {
  const [root, rootRef] = (0, import_react2.useState)(null);
  const [pending, setPending] = (0, import_react2.useState)(false);
  const [saving, setSaving] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)("");
  const current = (0, import_react2.useRef)({ dirty, busy, onSave, onClose });
  current.current = { dirty, busy, onSave, onClose };
  const action = (0, import_react2.useRef)(null);
  const bypass = (0, import_react2.useRef)(false);
  const savingNow = (0, import_react2.useRef)(false);
  const mounted = (0, import_react2.useRef)(false);
  (0, import_react2.useEffect)(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      action.current = null;
    };
  }, []);
  (0, import_react2.useEffect)(() => {
    const panel = root?.closest(SETTINGS_PANEL);
    const overlay = panel?.parentElement;
    if (!panel || !overlay) return;
    const navigation = panel.querySelector(":scope > nav");
    const header = navigation?.nextElementSibling?.firstElementChild;
    const closeButton = header?.querySelector(":scope > button");
    const mask = [...overlay.children].find((element) => element !== panel && element.getAttribute("aria-hidden") === "true");
    const ask = (event, proceed2) => {
      if (bypass.current || !current.current.dirty && !action.current) return;
      event.preventDefault();
      event.stopPropagation();
      if (action.current) return;
      action.current = proceed2;
      setError("");
      setPending(true);
    };
    const close = () => {
      if (current.current.onClose) current.current.onClose();
      else closeButton?.click();
    };
    const click = (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      if (target === mask || closeButton?.contains(target)) {
        ask(event, close);
        return;
      }
      const button = target.closest("button");
      if (button && navigation?.contains(button) && button.getAttribute("aria-current") !== "true") {
        ask(event, () => {
          if (button.isConnected) button.click();
        });
      }
    };
    const keydown = (event) => {
      if (event.defaultPrevented || event.repeat || event.isComposing || event.keyCode === 229 || event.key === "Dead" || event.getModifierState?.("AltGraph")) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('[role="dialog"][aria-modal="true"]') !== panel) return;
      if (isSettingsShortcut(event, panel.ownerDocument)) {
        if ([...panel.ownerDocument.querySelectorAll(MODAL_LAYERS)].at(-1) === panel) ask(event, close);
        return;
      }
      if (event.key !== "Escape" || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
      if (target?.closest('[role="menu"], [role="listbox"], [data-menu-material]')) return;
      ask(event, close);
    };
    overlay.addEventListener("click", click, true);
    overlay.addEventListener("keydown", keydown, true);
    return () => {
      overlay.removeEventListener("click", click, true);
      overlay.removeEventListener("keydown", keydown, true);
    };
  }, [root]);
  (0, import_react2.useEffect)(() => {
    if (!dirty) return;
    const beforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  const continueEditing = (0, import_react2.useCallback)(() => {
    if (savingNow.current || current.current.busy) return;
    action.current = null;
    setPending(false);
    setError("");
  }, []);
  const proceed = (0, import_react2.useCallback)(() => {
    const next = action.current;
    if (!next) return;
    action.current = null;
    setPending(false);
    setError("");
    bypass.current = true;
    try {
      next();
    } finally {
      bypass.current = false;
    }
  }, []);
  const discard = (0, import_react2.useCallback)(() => {
    if (!savingNow.current && !current.current.busy) proceed();
  }, [proceed]);
  const saveAndClose = (0, import_react2.useCallback)(async () => {
    if (!action.current || savingNow.current || current.current.busy) return false;
    if (!current.current.dirty) {
      proceed();
      return true;
    }
    savingNow.current = true;
    setSaving(true);
    setError("");
    try {
      const saved = await current.current.onSave();
      if (!mounted.current) return false;
      if (saved !== true) {
        setError("\u6A21\u578B\u914D\u7F6E\u5C1A\u672A\u4FDD\u5B58\uFF0C\u8BF7\u68C0\u67E5\u8BBE\u7F6E\u4E2D\u7684\u63D0\u793A\u540E\u91CD\u8BD5\u3002");
        return false;
      }
      proceed();
      return true;
    } catch (failure) {
      if (mounted.current) setError(failure?.message || "\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u3002");
      return false;
    } finally {
      savingNow.current = false;
      if (mounted.current) setSaving(false);
    }
  }, [proceed]);
  return { rootRef, pending, saving, error, continueEditing, discard, saveAndClose };
}

// src/client/route-editor.jsx
var import_react3 = __toESM(require("react"), 1);
function RouteEditor({ candidate, index, catalog, busy, isFallback, canRemove, editing, onEdit, onRemove, onChange }) {
  const editorId = (0, import_react3.useId)();
  const providers = catalog?.providers ?? [];
  const provider = providers.find((item) => item.id === candidate.provider);
  const model = provider?.models.find((item) => item.id === candidate.model);
  const efforts2 = model?.efforts ?? [];
  const effort = efforts2.find((item) => item.id === candidate.reasoningEffort);
  const unavailable = !model?.available || Boolean(candidate.reasoningEffort && !effort);
  const providerName = provider?.name || candidate.provider || "\u672A\u9009\u62E9\u4F9B\u5E94\u5546";
  const modelName = candidate.model ? modelLabel(candidate.provider, candidate.model, model?.name) : "\u672A\u9009\u62E9\u6267\u884C\u6A21\u578B";
  const modelSummary = `${providerName} \xB7 ${modelName} \xB7 ${effortLabel(candidate.reasoningEffort, effort?.name)}`;
  const description = candidate.description?.trim() ?? "";
  const extraDescription = candidate.extraDescription?.trim() ?? "";
  const purposeSummary = [description, extraDescription ? `\u8865\u5145\uFF1A${extraDescription}` : ""].filter(Boolean).join("\uFF1B");
  function changeModel(providerId, modelId) {
    const next = providers.find((item) => item.id === providerId)?.models.find((item) => item.id === modelId);
    onChange({ provider: providerId, model: modelId, reasoningEffort: next?.efforts?.some((item) => item.id === candidate.reasoningEffort) ? candidate.reasoningEffort : void 0 });
  }
  return /* @__PURE__ */ import_react3.default.createElement("article", { className: `dar-route-editor ${editing ? "is-editing" : "is-readonly"}`, "aria-label": `\u8DEF\u7531 ${index + 1}` }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "dar-route-title" }, /* @__PURE__ */ import_react3.default.createElement("h3", null, candidate.label || "\u65B0\u8DEF\u7531"), isFallback && /* @__PURE__ */ import_react3.default.createElement("span", { className: "dar-tag" }, "\u56DE\u9000\u6863\u4F4D"), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dar-route-actions" }, /* @__PURE__ */ import_react3.default.createElement("button", { type: "button", className: "dar-route-edit", disabled: busy, "aria-label": `${editing ? "\u6536\u8D77" : "\u7F16\u8F91"}\u8DEF\u7531 ${index + 1}`, "aria-expanded": Boolean(editing), "aria-controls": editing ? editorId : void 0, onClick: onEdit }, editing ? "\u6536\u8D77" : "\u7F16\u8F91"), /* @__PURE__ */ import_react3.default.createElement("button", { type: "button", className: "dar-remove", disabled: busy || !canRemove, title: !canRemove ? "\u81F3\u5C11\u4FDD\u7559 2 \u4E2A\u8DEF\u7531\u6863\u4F4D" : void 0, "aria-label": `\u5220\u9664\u8DEF\u7531 ${index + 1}`, onClick: onRemove }, "\u5220\u9664"))), !editing ? /* @__PURE__ */ import_react3.default.createElement("div", { className: "dar-route-summary" }, /* @__PURE__ */ import_react3.default.createElement("p", { className: "dar-route-model-line", title: modelSummary }, modelSummary), /* @__PURE__ */ import_react3.default.createElement("p", { className: "dar-route-description", title: purposeSummary || "\u5C1A\u672A\u586B\u5199\u7528\u9014\u63CF\u8FF0" }, purposeSummary || "\u5C1A\u672A\u586B\u5199\u7528\u9014\u63CF\u8FF0")) : /* @__PURE__ */ import_react3.default.createElement("div", { id: editorId }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "dar-route-fields" }, /* @__PURE__ */ import_react3.default.createElement("label", null, "\u540D\u79F0", /* @__PURE__ */ import_react3.default.createElement("input", { "aria-label": `\u8DEF\u7531 ${index + 1} \u540D\u79F0`, required: true, maxLength: 60, disabled: busy, value: candidate.label, placeholder: "\u4F8B\u5982\uFF1A\u524D\u7AEF\u8BBE\u8BA1", onChange: (event) => onChange({ label: event.target.value }) })), /* @__PURE__ */ import_react3.default.createElement("label", null, "\u4F9B\u5E94\u5546", /* @__PURE__ */ import_react3.default.createElement(Picker, { label: `\u8DEF\u7531 ${index + 1} \u4F9B\u5E94\u5546`, value: candidate.provider, disabled: busy, onChange: (value) => {
    const next = providers.find((item) => item.id === value);
    changeModel(value, next?.models.find((item) => item.available)?.id ?? "");
  }, options: [...!provider ? [{ value: candidate.provider, label: `${candidate.provider || "\u8BF7\u9009\u62E9\u4F9B\u5E94\u5546"}\uFF08\u4E0D\u53EF\u7528\uFF09`, disabled: true }] : [], ...providers.map((item) => ({ value: item.id, label: item.name, description: item.id === "local-fixture" ? "\u4EC5\u7528\u4E8E\u672C\u5730\u6D41\u7A0B\u6D4B\u8BD5" : item.id, disabled: !item.models.some((model2) => model2.available) }))] })), /* @__PURE__ */ import_react3.default.createElement("label", null, "\u6267\u884C\u6A21\u578B", /* @__PURE__ */ import_react3.default.createElement(Picker, { label: `\u8DEF\u7531 ${index + 1} \u6A21\u578B`, value: candidate.model, disabled: busy, searchable: true, onChange: (value) => changeModel(candidate.provider, value), options: [...!model ? [{ value: candidate.model, label: `${candidate.model || "\u8BF7\u9009\u62E9\u6A21\u578B"}\uFF08\u4E0D\u53EF\u7528\uFF09`, disabled: true }] : [], ...(provider?.models ?? []).map((item) => ({ value: item.id, label: modelLabel(candidate.provider, item.id, item.name), description: candidate.provider === "local-fixture" ? "\u672C\u5730\u6D4B\u8BD5\u6A21\u578B" : item.id, searchText: item.id, disabled: !item.available }))] })), /* @__PURE__ */ import_react3.default.createElement("label", null, "\u63A8\u7406\u5F3A\u5EA6", /* @__PURE__ */ import_react3.default.createElement(Picker, { label: `\u8DEF\u7531 ${index + 1} \u63A8\u7406\u5F3A\u5EA6`, value: candidate.reasoningEffort ?? "", disabled: busy || !model?.available, onChange: (value) => onChange({ reasoningEffort: value || void 0 }), options: [{ value: "", label: "\u6A21\u578B\u9ED8\u8BA4", description: efforts2.length === 0 ? "\u6B64\u6A21\u578B\u4E0D\u652F\u6301\u5355\u72EC\u8BBE\u7F6E\u63A8\u7406\u5F3A\u5EA6" : "\u6CBF\u7528\u6A21\u578B\u7684\u9ED8\u8BA4\u63A8\u7406\u5F3A\u5EA6" }, ...candidate.reasoningEffort && !effort ? [{ value: candidate.reasoningEffort, label: `${effortLabel(candidate.reasoningEffort)}\uFF08\u4E0D\u53EF\u7528\uFF09`, disabled: true }] : [], ...efforts2.map((item) => ({ value: item.id, label: effortLabel(item.id, item.name) }))] }))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dar-description-fields" }, /* @__PURE__ */ import_react3.default.createElement("label", null, "\u7528\u9014\u4E0E\u80FD\u529B\u63CF\u8FF0", /* @__PURE__ */ import_react3.default.createElement("textarea", { "aria-label": `\u8DEF\u7531 ${index + 1} \u7528\u9014\u63CF\u8FF0`, required: true, maxLength: 1e3, disabled: busy, value: candidate.description, placeholder: "\u63CF\u8FF0\u9002\u5408\u5904\u7406\u7684\u4EFB\u52A1\uFF0C\u51B3\u7B56\u6A21\u578B\u4F1A\u4F9D\u636E\u8FD9\u6BB5\u63CF\u8FF0\u9009\u62E9\u3002", onChange: (event) => onChange({ description: event.target.value }) })), /* @__PURE__ */ import_react3.default.createElement("label", null, "\u8865\u5145\u8BF4\u660E\uFF08\u53EF\u9009\uFF09", /* @__PURE__ */ import_react3.default.createElement("textarea", { "aria-label": `\u8DEF\u7531 ${index + 1} \u8865\u5145\u8BF4\u660E`, maxLength: 1e3, disabled: busy, value: candidate.extraDescription ?? "", placeholder: "\u4F8B\u5982\uFF1A\u4F18\u5148\u5904\u7406 React \u9875\u9762\u3001\u4EA4\u4E92\u4E0E\u89C6\u89C9\u8BBE\u8BA1\uFF1B\u6570\u636E\u5E93\u8FC1\u79FB\u4EA4\u7ED9\u540E\u7AEF\u8DEF\u7531\u3002", onChange: (event) => onChange({ extraDescription: event.target.value }) })))), unavailable && /* @__PURE__ */ import_react3.default.createElement("p", { className: "dar-inline-error" }, "\u5F53\u524D\u6A21\u578B\u6216\u63A8\u7406\u5F3A\u5EA6\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u3002"));
}

// src/client/model-settings.jsx
var cloudDraft = (value) => ({ endpoint: value?.endpoint ?? DEFAULT_CLOUD_ENDPOINT, model: value?.model ?? DEFAULT_CLOUD_MODEL, apiKey: "", consent: value?.consent ?? null, hasApiKey: value?.hasApiKey ?? false });
var editable = (data) => ({ candidates: data.candidates, fallback: data.fallback, sidebarEnabled: data.sidebarEnabled, decisionModel: data.decisionModel ?? "laya", mode: data.mode ?? "auto", cloudDecision: cloudDraft(data.cloudDecision) });
var modes = { auto: "\u81EA\u52A8\u9009\u62E9", shadow: "\u4EC5\u89C2\u5BDF", off: "\u6682\u505C\u51B3\u7B56" };
var modeHelp = { auto: "\u7531\u51B3\u7B56\u6A21\u578B\u9009\u62E9\u6267\u884C\u6A21\u578B\uFF0C\u65E0\u6CD5\u786E\u5B9A\u65F6\u4F7F\u7528\u56DE\u9000\u6863\u4F4D\u3002", shadow: "\u8BB0\u5F55\u51B3\u7B56\u6A21\u578B\u7684\u5EFA\u8BAE\uFF0C\u5B9E\u9645\u4F7F\u7528\u56DE\u9000\u6863\u4F4D\u6267\u884C\u3002", off: "\u6682\u505C\u8C03\u7528\u51B3\u7B56\u6A21\u578B\uFF0C\u76F4\u63A5\u4F7F\u7528\u56DE\u9000\u6863\u4F4D\u6267\u884C\u3002" };
var savedListeners = /* @__PURE__ */ new Set();
function ModelSettings({ request, onSaved, current, service, onClose }) {
  const editorId = (0, import_react4.useId)();
  const [catalog, setCatalog] = (0, import_react4.useState)(null);
  const [draft, setDraft] = (0, import_react4.useState)(null);
  const [busy, setBusy] = (0, import_react4.useState)(false);
  const [error, setError] = (0, import_react4.useState)("");
  const [notice, setNotice] = (0, import_react4.useState)("");
  const [preferenceBusy, setPreferenceBusy] = (0, import_react4.useState)(false);
  const [consentPrompt, setConsentPrompt] = (0, import_react4.useState)(null);
  const [editingId, setEditingId] = (0, import_react4.useState)(null);
  const [removingId, setRemovingId] = (0, import_react4.useState)(null);
  const consentResolver = (0, import_react4.useRef)(null);
  const dirty = draft && JSON.stringify(draft) !== JSON.stringify(editable(catalog));
  const cloudSelected = draft?.decisionModel === CLOUD_DECISION_MODEL;
  const guard = useUnsavedGuard({ dirty: Boolean(dirty), busy: busy || preferenceBusy || Boolean(consentPrompt) || Boolean(removingId), onSave: () => save(), onClose });
  const removing = draft?.candidates.find((candidate) => candidate.id === removingId);
  const decisionService = service ?? catalog?.decisionService;
  const availableDecisions = decisionService?.models ?? catalog?.decisionModels ?? [];
  const decisionModels = DECISION_MODELS.map((model) => ({ ...model, ...availableDecisions.find((candidate) => candidate.id === model.id) }));
  const selectedDecision = decisionModels.find((model) => model.id === draft?.decisionModel);
  const decisionStatus = decisionModelStatus(decisionService && { ...decisionService, models: decisionModels }, draft?.decisionModel ?? "laya");
  function acceptExternal(next) {
    if (!catalog || next.revision <= catalog.revision) return;
    setNotice("");
    if (dirty) {
      setError("\u914D\u7F6E\u5DF2\u5728\u53E6\u4E00\u4E2A\u9875\u9762\u66F4\u65B0\u3002\u5F53\u524D\u8349\u7A3F\u5DF2\u4FDD\u7559\uFF0C\u8BF7\u91CD\u65B0\u8F7D\u5165\u540E\u518D\u4FEE\u6539\u3002");
      return;
    }
    setCatalog((previous) => ({ ...previous, ...next }));
    setDraft(editable(next));
    setError("");
  }
  (0, import_react4.useEffect)(() => {
    const listener = (next, sender) => {
      if (sender !== editorId) acceptExternal(next);
    };
    savedListeners.add(listener);
    return () => savedListeners.delete(listener);
  }, [catalog, dirty]);
  (0, import_react4.useEffect)(() => {
    if (current) acceptExternal(current);
  }, [current?.revision]);
  async function load(replace = false) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const next = await request("/models");
      setCatalog((current2) => replace || !current2 ? next : { ...current2, providers: next.providers, decisionModels: next.decisionModels, decisionService: next.decisionService });
      if (replace) {
        setDraft(editable(next));
        setEditingId(null);
      }
    } catch (error2) {
      setError(error2.message);
    } finally {
      setBusy(false);
    }
  }
  (0, import_react4.useEffect)(() => {
    let active = true;
    request("/models").then((next) => {
      if (active) {
        setCatalog(next);
        setDraft(editable(next));
      }
    }).catch((error2) => {
      if (active) setError(error2.message);
    });
    return () => {
      active = false;
    };
  }, []);
  function update(id, patch) {
    setNotice("");
    setDraft((current2) => ({ ...current2, candidates: current2.candidates.map((candidate) => candidate.id === id ? { ...candidate, ...patch } : candidate) }));
  }
  function add() {
    const provider = catalog.providers.find((provider2) => provider2.models.some((model2) => model2.available));
    const model = provider?.models.find((model2) => model2.available);
    setNotice("");
    const id = `route_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
    setDraft((current2) => ({ ...current2, fallback: current2.fallback ?? id, candidates: [...current2.candidates, { id, label: "", provider: provider?.id ?? "", model: model?.id ?? "", description: "", extraDescription: "" }] }));
    setEditingId(id);
  }
  function remove(id) {
    if (draft.candidates.length <= 2) return;
    setNotice("");
    setDraft((current2) => {
      const candidates = current2.candidates.filter((candidate) => candidate.id !== id);
      return { ...current2, candidates, fallback: current2.fallback === id ? candidates[0].id : current2.fallback };
    });
    if (editingId === id) setEditingId(null);
    setRemovingId(null);
  }
  function askConsent(config) {
    setConsentPrompt({ endpoint: config.endpoint, model: config.model });
    return new Promise((resolve) => {
      consentResolver.current = resolve;
    });
  }
  function answerConsent(accepted) {
    setConsentPrompt(null);
    consentResolver.current?.(accepted);
    consentResolver.current = null;
  }
  (0, import_react4.useEffect)(() => () => consentResolver.current?.(false), []);
  const consentFor = (config) => ({ version: 1, endpoint: config.endpoint.trim(), model: config.model.trim() });
  async function changeDecision(value) {
    if (value === CLOUD_DECISION_MODEL) {
      if (!await askConsent(draft.cloudDecision)) return;
      setDraft((current2) => ({ ...current2, decisionModel: value, cloudDecision: { ...current2.cloudDecision, consent: consentFor(current2.cloudDecision) } }));
    } else setDraft((current2) => ({ ...current2, decisionModel: value, cloudDecision: cloudDraft(catalog.cloudDecision) }));
    setNotice("");
  }
  async function preference(patch) {
    if (preferenceBusy || busy) return;
    setPreferenceBusy(true);
    setError("");
    setNotice("");
    try {
      const saved = await request("/preferences", { revision: catalog.revision, ...patch });
      setCatalog((previous) => ({ ...previous, ...saved }));
      setDraft((previous) => ({ ...previous, mode: saved.mode, sidebarEnabled: saved.sidebarEnabled }));
      for (const listener of savedListeners) listener(saved, editorId);
      onSaved(saved);
    } catch (error2) {
      setError(error2.message);
    } finally {
      setPreferenceBusy(false);
    }
  }
  async function save(event) {
    event?.preventDefault();
    let next = draft;
    if (next.decisionModel === CLOUD_DECISION_MODEL) {
      const expected = consentFor(next.cloudDecision);
      const actual = next.cloudDecision.consent;
      if (!actual || actual.version !== 1 || actual.endpoint !== expected.endpoint || actual.model !== expected.model) {
        if (!await askConsent(next.cloudDecision)) return false;
        next = { ...next, cloudDecision: { ...next.cloudDecision, consent: expected } };
        setDraft(next);
      }
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { cloudDecision, ...settings } = next;
      const cloud = next.decisionModel === CLOUD_DECISION_MODEL ? { endpoint: cloudDecision.endpoint, model: cloudDecision.model, consent: cloudDecision.consent, ...cloudDecision.apiKey ? { apiKey: cloudDecision.apiKey } : {} } : void 0;
      const saved = await request("/models", { ...settings, ...cloud ? { cloudDecision: cloud } : {}, revision: catalog.revision });
      setCatalog((current2) => ({ ...current2, ...saved }));
      setDraft(editable(saved));
      setEditingId(null);
      for (const listener of savedListeners) listener(saved, editorId);
      onSaved(saved);
      setNotice(saved.persistent ? "\u5DF2\u4FDD\u5B58\u5230\u672C\u5730\u3002\u65B0\u914D\u7F6E\u4ECE\u4E0B\u4E00\u8F6E\u51B3\u7B56\u751F\u6548\uFF0C\u91CD\u542F\u540E\u4FDD\u7559\u3002" : "\u5DF2\u4FDD\u5B58\uFF0C\u4ECE\u4E0B\u4E00\u8F6E\u51B3\u7B56\u751F\u6548\u3002\u5F53\u524D\u5BBF\u4E3B\u672A\u8BBE\u7F6E\u6301\u4E45\u5316\u8DEF\u5F84\uFF0C\u91CD\u542F\u540E\u4F1A\u6062\u590D\u9ED8\u8BA4\u503C\u3002");
      return true;
    } catch (error2) {
      setError(error2.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ import_react4.default.createElement("div", { className: "dar-model-settings", ref: guard.rootRef }, error && /* @__PURE__ */ import_react4.default.createElement("div", { className: "dar-error", role: "alert" }, error), notice && /* @__PURE__ */ import_react4.default.createElement("div", { className: "dar-success", role: "status" }, notice), !draft ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "dar-empty" }, /* @__PURE__ */ import_react4.default.createElement("p", null, "\u6B63\u5728\u8BFB\u53D6\u8DEF\u7531\u914D\u7F6E\u2026"), error && /* @__PURE__ */ import_react4.default.createElement("button", { className: "dar-button", onClick: () => void load(true) }, "\u91CD\u65B0\u8F7D\u5165")) : /* @__PURE__ */ import_react4.default.createElement("form", { onSubmit: save }, /* @__PURE__ */ import_react4.default.createElement("fieldset", { disabled: busy, className: "dar-settings-fields" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "dar-mode-setting" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "dar-mode-setting-row" }, /* @__PURE__ */ import_react4.default.createElement("div", null, /* @__PURE__ */ import_react4.default.createElement("h2", null, "\u8DEF\u7531\u6A21\u5F0F"), /* @__PURE__ */ import_react4.default.createElement("p", null, "\u81EA\u52A8\u4FDD\u5B58\uFF0C\u4ECE\u4E0B\u4E00\u8F6E\u751F\u6548\u3002")), /* @__PURE__ */ import_react4.default.createElement(Picker, { label: "\u8DEF\u7531\u6A21\u5F0F", value: draft.mode, disabled: busy || preferenceBusy, onChange: (mode) => void preference({ mode }), options: Object.entries(modes).map(([value, label]) => ({ value, label })) })), /* @__PURE__ */ import_react4.default.createElement("p", { className: "dar-mode-help" }, modeHelp[draft.mode])), /* @__PURE__ */ import_react4.default.createElement("div", { className: "dar-settings-options dar-sidebar-setting" }, /* @__PURE__ */ import_react4.default.createElement("div", null, /* @__PURE__ */ import_react4.default.createElement("h2", null, "\u4FA7\u8FB9\u680F\u5165\u53E3"), /* @__PURE__ */ import_react4.default.createElement("p", null, "\u5207\u6362\u540E\u7ACB\u5373\u751F\u6548\uFF0C\u65E0\u9700\u5355\u72EC\u4FDD\u5B58\u3002")), /* @__PURE__ */ import_react4.default.createElement(Picker, { label: "\u4FA7\u8FB9\u680F\u5165\u53E3", value: draft.sidebarEnabled ? "on" : "off", disabled: busy || preferenceBusy, onChange: (value) => void preference({ sidebarEnabled: value === "on" }), options: [{ value: "on", label: "\u5F00\u542F\uFF08\u9ED8\u8BA4\uFF09" }, { value: "off", label: "\u5173\u95ED" }] })), /* @__PURE__ */ import_react4.default.createElement("section", { className: "dar-decision-settings", "aria-label": "\u51B3\u7B56\u6A21\u578B\u8BBE\u7F6E" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "dar-decision-heading" }, /* @__PURE__ */ import_react4.default.createElement("h2", null, "\u51B3\u7B56\u6A21\u578B"), /* @__PURE__ */ import_react4.default.createElement("span", { className: `dar-tag ${cloudSelected ? "dar-cloud-text" : ""}` }, cloudSelected ? "\u4E91\u7AEF API" : "\u672C\u5730\u63A8\u7406")), /* @__PURE__ */ import_react4.default.createElement("div", { className: "dar-decision-choice" }, /* @__PURE__ */ import_react4.default.createElement(Picker, { label: "\u51B3\u7B56\u6A21\u578B", value: draft.decisionModel, disabled: busy || preferenceBusy, onChange: (value) => void changeDecision(value), options: [...decisionModels.map((model) => ({ value: model.id, label: `${model.label}${model.experimental ? "\uFF08\u5B9E\u9A8C\uFF09" : ""}`, description: model.installed === true ? "\u672C\u673A\u8FD0\u884C \xB7 \u5DF2\u5B89\u88C5" : model.installed === false ? "\u672C\u673A\u8FD0\u884C \xB7 \u672A\u5B89\u88C5" : "\u672C\u673A\u8FD0\u884C \xB7 \u5B89\u88C5\u72B6\u6001\u5F85\u786E\u8BA4" })), { value: CLOUD_DECISION_MODEL, label: "System One API\uFF08\u4E91\u7AEF\uFF09", description: "Jev \u6216\u517C\u5BB9\u63A5\u53E3 \xB7 \u9700\u786E\u8BA4\u6570\u636E\u4F20\u8F93\u98CE\u9669" }] }), /* @__PURE__ */ import_react4.default.createElement("span", { className: `dar-status ${decisionStatus.ready ? "is-ready" : ""} ${cloudSelected ? "is-cloud" : ""}` }, /* @__PURE__ */ import_react4.default.createElement("i", null), decisionStatus.text)), cloudSelected ? /* @__PURE__ */ import_react4.default.createElement(import_react4.default.Fragment, null, /* @__PURE__ */ import_react4.default.createElement("div", { className: "dar-cloud-warning" }, /* @__PURE__ */ import_react4.default.createElement("strong", null, "\u6CE8\u610F\uFF1A\u76F8\u5173\u6570\u636E\u5C06\u79BB\u5F00\u672C\u673A"), /* @__PURE__ */ import_react4.default.createElement("p", null, "\u4EFB\u52A1\u5185\u5BB9\u3001\u8FD1\u671F\u4E0A\u4E0B\u6587\u53CA\u5404\u6863\u6A21\u578B\u7684\u7528\u9014\u63CF\u8FF0\u548C\u8865\u5145\u8BF4\u660E\u53EF\u80FD\u88AB\u4F20\u8F93\u5230 System One \u6A21\u578B\u63D0\u4F9B\u5546\u7684\u670D\u52A1\u5668\u3002\u8BF7\u6CE8\u610F\u7504\u522B\u63D0\u4F9B\u5546\u53CA\u63A5\u53E3\u5730\u5740\u3002")), /* @__PURE__ */ import_react4.default.createElement("div", { className: "dar-cloud-fields" }, /* @__PURE__ */ import_react4.default.createElement("label", null, "API \u5730\u5740", /* @__PURE__ */ import_react4.default.createElement("input", { type: "url", required: true, "aria-label": "\u51B3\u7B56 API \u5730\u5740", value: draft.cloudDecision.endpoint, onChange: (event) => setDraft((current2) => ({ ...current2, cloudDecision: { ...current2.cloudDecision, endpoint: event.target.value, apiKey: "", hasApiKey: false, consent: null } })) })), /* @__PURE__ */ import_react4.default.createElement("label", null, "\u51B3\u7B56\u6A21\u578B\u540D\u79F0", /* @__PURE__ */ import_react4.default.createElement("input", { required: true, maxLength: 100, "aria-label": "API \u51B3\u7B56\u6A21\u578B\u540D\u79F0", value: draft.cloudDecision.model, onChange: (event) => setDraft((current2) => ({ ...current2, cloudDecision: { ...current2.cloudDecision, model: event.target.value, consent: null } })) })), /* @__PURE__ */ import_react4.default.createElement("label", null, "API \u5BC6\u94A5", /* @__PURE__ */ import_react4.default.createElement("input", { type: "password", autoComplete: "new-password", "aria-label": "\u51B3\u7B56 API \u5BC6\u94A5", maxLength: 4096, required: !draft.cloudDecision.hasApiKey, placeholder: draft.cloudDecision.hasApiKey ? "\u5DF2\u914D\u7F6E\uFF1B\u7559\u7A7A\u4FDD\u7559\u539F\u5BC6\u94A5" : "\u8F93\u5165\u63D0\u4F9B\u5546\u7684 API \u5BC6\u94A5", value: draft.cloudDecision.apiKey, onChange: (event) => setDraft((current2) => ({ ...current2, cloudDecision: { ...current2.cloudDecision, apiKey: event.target.value } })) }))), /* @__PURE__ */ import_react4.default.createElement("p", { className: "dar-inline-note" }, "\u5BC6\u94A5\u4EC5\u4FDD\u5B58\u5728\u672C\u673A\u914D\u7F6E\u6587\u4EF6\uFF0C\u4E0D\u4F1A\u56DE\u663E\u3002API \u5931\u8D25\u65F6\u4F7F\u7528\u56DE\u9000\u6267\u884C\u6863\u4F4D\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u5207\u6362\u5230\u5176\u4ED6\u8FDC\u7A0B\u670D\u52A1\u3002")) : /* @__PURE__ */ import_react4.default.createElement("p", { className: "dar-decision-hint" }, "\u672C\u673A\u63A8\u7406\uFF0C\u4EFB\u52A1\u5185\u5BB9\u4E0D\u51FA\u673A\u3002\u6A21\u578B\u4FEE\u6539\u4FDD\u5B58\u540E\u751F\u6548\u3002"), selectedDecision?.experimental && /* @__PURE__ */ import_react4.default.createElement("p", { className: "dar-inline-note" }, "\u6B64\u6A21\u578B\u4E3A\u5B9E\u9A8C\u652F\u6301\uFF0C\u8BF7\u5148\u7528\u672C\u5730\u6D4B\u8BD5\u4EFB\u52A1\u68C0\u67E5\u9009\u62E9\u7ED3\u679C\u3002"), selectedDecision?.installed === false && /* @__PURE__ */ import_react4.default.createElement("div", { className: "dar-decision-warning", role: "status" }, /* @__PURE__ */ import_react4.default.createElement("p", null, "\u6240\u9009\u51B3\u7B56\u6A21\u578B\u5C1A\u672A\u5B89\u88C5\u3002\u53EF\u4EE5\u4FDD\u5B58\u6B64\u9009\u62E9\uFF1B\u5B89\u88C5\u5B8C\u6210\u524D\u65E0\u6CD5\u8FDB\u884C\u8BE5\u6A21\u578B\u7684\u81EA\u52A8\u51B3\u7B56\uFF0C\u5C06\u4F7F\u7528\u5DF2\u914D\u7F6E\u7684\u56DE\u9000\u6267\u884C\u6863\u4F4D\u3002"), /* @__PURE__ */ import_react4.default.createElement("p", null, "\u5728\u9879\u76EE\u76EE\u5F55\u8FD0\u884C", draft.decisionModel === "laya" ? /* @__PURE__ */ import_react4.default.createElement(import_react4.default.Fragment, null, /* @__PURE__ */ import_react4.default.createElement("code", null, "pnpm run laya:setup"), "\uFF0C\u518D\u8FD0\u884C ", /* @__PURE__ */ import_react4.default.createElement("code", null, "pnpm run laya:download")) : /* @__PURE__ */ import_react4.default.createElement("code", null, "pnpm run d1:setup"), "\uFF0C\u5B8C\u6210\u540E\u5237\u65B0\u6A21\u578B\u5217\u8868\u3002")), !cloudSelected && selectedDecision?.installed === void 0 && /* @__PURE__ */ import_react4.default.createElement("p", { className: "dar-inline-note" }, "\u5C1A\u672A\u786E\u8BA4\u6240\u9009\u6A21\u578B\u662F\u5426\u5DF2\u5B89\u88C5\uFF0C\u8BF7\u8FDE\u63A5\u672C\u5730\u670D\u52A1\u540E\u5237\u65B0\u6A21\u578B\u5217\u8868\u3002\u4E0D\u53EF\u7528\u65F6\u4F1A\u4F7F\u7528\u56DE\u9000\u6267\u884C\u6863\u4F4D\u3002")), /* @__PURE__ */ import_react4.default.createElement("div", { className: "dar-settings-intro" }, /* @__PURE__ */ import_react4.default.createElement("div", null, /* @__PURE__ */ import_react4.default.createElement("h2", null, "\u8DEF\u7531\u6863\u4F4D"), /* @__PURE__ */ import_react4.default.createElement("p", null, "\u8BBE\u7F6E 2\u20136 \u4E2A\u9009\u62E9\u3002\u6863\u4F4D\u4E0D\u4EE3\u8868\u56FA\u5B9A\u6392\u540D\uFF0C\u4E5F\u53EF\u4EE5\u6309\u524D\u7AEF\u3001\u540E\u7AEF\u3001\u7FFB\u8BD1\u7B49\u4EFB\u52A1\u5212\u5206\u3002")), /* @__PURE__ */ import_react4.default.createElement("span", { className: "dar-tag" }, draft.candidates.length, " / 6")), /* @__PURE__ */ import_react4.default.createElement("div", { className: "dar-provider-help" }, /* @__PURE__ */ import_react4.default.createElement("p", null, "\u4F9B\u5E94\u5546\u3001\u63A5\u53E3\u5BC6\u94A5\u548C\u53EF\u7528\u6A21\u578B\u8BF7\u5728\u5DE6\u4E0B\u89D2 ", /* @__PURE__ */ import_react4.default.createElement("strong", null, "\u8BBE\u7F6E \u2192 \u6A21\u578B"), " \u4E2D\u914D\u7F6E\uFF0C\u7136\u540E\u5237\u65B0\u5217\u8868\u3002\u8FD9\u91CC\u590D\u7528 DSH \u5DF2\u914D\u7F6E\u7684\u6A21\u578B\u3002\u5728\u5BF9\u8BDD\u5E95\u90E8\u9009\u62E9\u201C\u81EA\u52A8\u201D\u540E\uFF0C\u624D\u4F1A\u6839\u636E\u4EE5\u4E0B\u6863\u4F4D\u8DEF\u7531\uFF1B\u9009\u62E9\u5177\u4F53\u6A21\u578B\u65F6\u76F4\u63A5\u4F7F\u7528\u8BE5\u6A21\u578B\u3002"), /* @__PURE__ */ import_react4.default.createElement("button", { type: "button", className: "dar-button", onClick: () => void load(false) }, "\u5237\u65B0\u6A21\u578B\u5217\u8868")), !catalog.providers.some((provider) => provider.models.some((model) => model.available)) ? /* @__PURE__ */ import_react4.default.createElement("p", { className: "dar-inline-note" }, "\u5C1A\u672A\u53D1\u73B0\u53EF\u7528\u6267\u884C\u6A21\u578B\uFF0C\u8BF7\u5148\u5728\u300C\u8BBE\u7F6E \u2192 \u6A21\u578B\u300D\u4E2D\u6DFB\u52A0\u4F9B\u5E94\u5546\u548C\u6A21\u578B\uFF0C\u518D\u5237\u65B0\u5217\u8868\u3002") : !catalog.providers.some((provider) => provider.id !== "local-fixture" && provider.models.some((model) => model.available)) && /* @__PURE__ */ import_react4.default.createElement("p", { className: "dar-inline-note" }, "\u5F53\u524D\u4EC5\u53D1\u73B0\u672C\u5730\u6D4B\u8BD5\u6267\u884C\u7AEF\u3002\u9009\u62E9\u8FD9\u4E9B\u6A21\u578B\u53EF\u9A8C\u8BC1\u8DEF\u7531\u6D41\u7A0B\uFF0C\u4F46\u4E0D\u4F1A\u751F\u6210\u771F\u5B9E\u4EFB\u52A1\u7B54\u6848\u3002"), draft.candidates.length === 0 && /* @__PURE__ */ import_react4.default.createElement("p", { className: "dar-inline-note" }, "\u5C1A\u672A\u914D\u7F6E\u8DEF\u7531\u3002\u8BF7\u6DFB\u52A0 2\u20136 \u4E2A\u6863\u4F4D\u3001\u9009\u62E9\u6267\u884C\u6A21\u578B\u5E76\u586B\u5199\u7528\u9014\uFF0C\u4FDD\u5B58\u540E\u5F00\u542F\u81EA\u52A8\u9009\u62E9\u3002"), /* @__PURE__ */ import_react4.default.createElement("div", { className: "dar-route-editors" }, draft.candidates.map((candidate, index) => /* @__PURE__ */ import_react4.default.createElement(RouteEditor, { key: candidate.id, candidate, index, catalog, busy: busy || preferenceBusy, isFallback: candidate.id === draft.fallback, canRemove: draft.candidates.length > 2, editing: editingId === candidate.id, onEdit: () => setEditingId((current2) => current2 === candidate.id ? null : candidate.id), onRemove: () => setRemovingId(candidate.id), onChange: (patch) => update(candidate.id, patch) }))), /* @__PURE__ */ import_react4.default.createElement("div", { className: "dar-route-controls" }, /* @__PURE__ */ import_react4.default.createElement("button", { type: "button", className: "dar-button", disabled: draft.candidates.length >= 6, onClick: add }, "\uFF0B \u6DFB\u52A0\u8DEF\u7531\u6863\u4F4D"), /* @__PURE__ */ import_react4.default.createElement("label", null, "\u65E0\u6CD5\u786E\u5B9A\u65F6\u4F7F\u7528", /* @__PURE__ */ import_react4.default.createElement(Picker, { label: "\u56DE\u9000\u6863\u4F4D", value: draft.fallback, disabled: busy, onChange: (value) => {
    setNotice("");
    setDraft({ ...draft, fallback: value });
  }, options: draft.candidates.map((candidate) => ({ value: candidate.id, label: candidate.label || "\u672A\u547D\u540D\u8DEF\u7531", description: modelLabel(candidate.provider, candidate.model) })) }))), /* @__PURE__ */ import_react4.default.createElement("p", { className: "dar-inline-note" }, "\u63CF\u8FF0\u548C\u8865\u5145\u8BF4\u660E\u4F1A\u4E00\u8D77\u4EA4\u7ED9\u6240\u9009\u7684\u51B3\u7B56\u6A21\u578B\u3002\u4FDD\u6301\u7B80\u6D01\uFF0C\u8BF4\u660E\u5404\u81EA\u64C5\u957F\u4E0E\u4E0D\u9002\u5408\u7684\u4EFB\u52A1\uFF1B\u5B83\u4EEC\u4E0D\u4F9D\u8D56\u540D\u79F0\u3001\u6807\u8BC6\u6216\u6392\u5217\u987A\u5E8F\u6765\u8868\u8FBE\u4F18\u5148\u7EA7\u3002")), /* @__PURE__ */ import_react4.default.createElement("div", { className: "dar-save-row" }, /* @__PURE__ */ import_react4.default.createElement("span", null, dirty ? "\u6A21\u578B\u914D\u7F6E\u6709\u672A\u4FDD\u5B58\u7684\u4FEE\u6539" : "\u6A21\u578B\u914D\u7F6E\u5DF2\u540C\u6B65"), /* @__PURE__ */ import_react4.default.createElement("div", null, /* @__PURE__ */ import_react4.default.createElement("button", { type: "button", className: "dar-button", disabled: busy || preferenceBusy, onClick: () => void load(true) }, dirty ? "\u653E\u5F03\u4FEE\u6539\u5E76\u91CD\u65B0\u8F7D\u5165" : "\u91CD\u65B0\u8F7D\u5165"), /* @__PURE__ */ import_react4.default.createElement("button", { className: "dar-primary", type: "submit", disabled: busy || preferenceBusy || !dirty }, busy ? "\u6B63\u5728\u4FDD\u5B58\u2026" : "\u4FDD\u5B58\u6A21\u578B\u914D\u7F6E")))), /* @__PURE__ */ import_react4.default.createElement(import_dsh_client_ui_primitives2.Modal, { open: Boolean(removing), title: "\u5220\u9664\u8DEF\u7531\u6863\u4F4D\uFF1F", closeLabel: "\u53D6\u6D88", onClose: () => setRemovingId(null), footer: /* @__PURE__ */ import_react4.default.createElement("div", { className: "dar-dialog-actions" }, /* @__PURE__ */ import_react4.default.createElement("button", { className: "dar-button", onClick: () => setRemovingId(null) }, "\u53D6\u6D88"), /* @__PURE__ */ import_react4.default.createElement("button", { className: "dar-danger-button", onClick: () => remove(removingId) }, "\u5220\u9664\u6863\u4F4D")) }, /* @__PURE__ */ import_react4.default.createElement("p", { className: "dar-dialog-copy" }, "\u786E\u5B9A\u5220\u9664\u300C", removing?.label || "\u672A\u547D\u540D\u8DEF\u7531", "\u300D\uFF1F\u5220\u9664\u5148\u4FDD\u7559\u5728\u8349\u7A3F\u4E2D\uFF0C\u4FDD\u5B58\u6A21\u578B\u914D\u7F6E\u540E\u624D\u4F1A\u751F\u6548\u3002"), removingId === draft?.fallback && /* @__PURE__ */ import_react4.default.createElement("p", { className: "dar-dialog-copy" }, "\u8FD9\u662F\u5F53\u524D\u56DE\u9000\u6863\u4F4D\uFF0C\u5220\u9664\u540E\u5C06\u6539\u7528\u300C", draft?.candidates.find((candidate) => candidate.id !== removingId)?.label, "\u300D\u3002")), /* @__PURE__ */ import_react4.default.createElement(import_dsh_client_ui_primitives2.Modal, { open: Boolean(consentPrompt), title: "\u542F\u7528\u4E91\u7AEF\u51B3\u7B56\u524D\uFF0C\u8BF7\u786E\u8BA4", closeLabel: "\u653E\u5F03", onClose: () => answerConsent(false), footer: /* @__PURE__ */ import_react4.default.createElement("div", { className: "dar-dialog-actions" }, /* @__PURE__ */ import_react4.default.createElement("button", { className: "dar-button", onClick: () => answerConsent(false) }, "\u653E\u5F03"), /* @__PURE__ */ import_react4.default.createElement("button", { className: "dar-danger-button", onClick: () => answerConsent(true) }, "\u6211\u5DF2\u4E86\u89E3")) }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "dar-cloud-warning", role: "alert" }, /* @__PURE__ */ import_react4.default.createElement("strong", null, "\u6B64\u64CD\u4F5C\u53EF\u80FD\u5C06\u76F8\u5173\u6570\u636E\u4F20\u8F93\u5230 System One \u6A21\u578B\u63D0\u4F9B\u5546\u7684\u670D\u52A1\u5668\uFF01"), /* @__PURE__ */ import_react4.default.createElement("p", null, "\u5305\u62EC\u672C\u8F6E\u4EFB\u52A1\u5185\u5BB9\u3001\u8FD1\u671F\u5BF9\u8BDD\u4E0A\u4E0B\u6587\u3001\u8DEF\u7531\u6863\u4F4D\u7684\u7528\u9014\u63CF\u8FF0\u548C\u8865\u5145\u8BF4\u660E\u3002\u8BF7\u6CE8\u610F\u7504\u522B\u63D0\u4F9B\u5546\uFF0C\u5E76\u786E\u8BA4\u4F60\u613F\u610F\u5411\u5176\u4F20\u8F93\u8FD9\u4E9B\u6570\u636E\u3002"), /* @__PURE__ */ import_react4.default.createElement("p", null, "\u76EE\u6807\u63A5\u53E3\uFF1A", /* @__PURE__ */ import_react4.default.createElement("code", null, consentPrompt?.endpoint), /* @__PURE__ */ import_react4.default.createElement("br", null), "\u51B3\u7B56\u6A21\u578B\uFF1A", consentPrompt?.model), /* @__PURE__ */ import_react4.default.createElement("p", null, "\u9009\u62E9\u201C\u6211\u5DF2\u4E86\u89E3\u201D\u540E\u53EF\u7EE7\u7EED\u914D\u7F6E\u3002\u4FDD\u5B58\u540E\uFF0C\u5BF9\u8BDD\u9009\u62E9\u201C\u81EA\u52A8\u201D\u4E14\u8DEF\u7531\u6A21\u5F0F\u4E3A\u201C\u81EA\u52A8\u9009\u62E9\u201D\u6216\u201C\u4EC5\u89C2\u5BDF\u201D\u65F6\u4F1A\u53D1\u9001\u4E91\u7AEF\u8BF7\u6C42\uFF1B\u201C\u6682\u505C\u51B3\u7B56\u201D\u4E0D\u4F1A\u53D1\u9001\u3002"))), /* @__PURE__ */ import_react4.default.createElement(import_dsh_client_ui_primitives2.Modal, { open: guard.pending, title: "\u6A21\u578B\u914D\u7F6E\u5C1A\u672A\u4FDD\u5B58", closeLabel: "\u7EE7\u7EED\u7F16\u8F91", onClose: guard.continueEditing, description: "\u4E0D\u4FDD\u5B58\u5C31\u5173\u95ED\u4F1A\u4E22\u5931\u76F8\u5173\u4FEE\u6539\uFF0C\u662F\u5426\u4FDD\u5B58\uFF1F", footer: /* @__PURE__ */ import_react4.default.createElement("div", { className: "dar-dialog-actions" }, /* @__PURE__ */ import_react4.default.createElement("button", { className: "dar-button", disabled: guard.saving, onClick: guard.continueEditing }, "\u7EE7\u7EED\u7F16\u8F91"), /* @__PURE__ */ import_react4.default.createElement("button", { className: "dar-button", disabled: guard.saving, onClick: guard.discard }, "\u653E\u5F03\u4FEE\u6539"), /* @__PURE__ */ import_react4.default.createElement("button", { className: "dar-primary", disabled: guard.saving, onClick: guard.saveAndClose }, guard.saving ? "\u6B63\u5728\u4FDD\u5B58\u2026" : "\u4FDD\u5B58\u5E76\u5173\u95ED")) }, (error || guard.error) && /* @__PURE__ */ import_react4.default.createElement("p", { className: "dar-inline-error", role: "alert" }, error || guard.error)));
}

// src/client/locale.js
var CHINESE_LOCALE = "zh-CN";
function installChineseLocale(ctx) {
  return ctx.effect(() => {
    const locale = ctx.locale;
    let removeDictionary = () => {
    };
    let removeLanguage;
    let unsubscribe = () => {
    };
    try {
      try {
        removeDictionary = locale.register("model", CHINESE_LOCALE, { "effort.providerDefault": "\u9ED8\u8BA4" });
      } catch (error) {
        if (error.message !== `locale namespace "model" already has locale "${CHINESE_LOCALE}"`) throw error;
      }
      if (!locale.getLocale().locales.some((language) => language.id.toLowerCase() === CHINESE_LOCALE.toLowerCase())) {
        removeLanguage = locale.addLanguage({ id: CHINESE_LOCALE, label: "\u7B80\u4F53\u4E2D\u6587", fallback: "zh" });
      }
      const useCompleteChinese = () => {
        if (locale.getLocale().active === "zh") locale.setLocale(CHINESE_LOCALE);
      };
      unsubscribe = locale.subscribe(useCompleteChinese);
      useCompleteChinese();
    } catch (error) {
      unsubscribe();
      removeLanguage?.();
      removeDictionary();
      throw error;
    }
    return () => {
      unsubscribe();
      if (removeLanguage && locale.getLocale().active.toLowerCase() === CHINESE_LOCALE.toLowerCase()) locale.setLocale("zh");
      removeLanguage?.();
      removeDictionary();
    };
  });
}

// src/client/index.jsx
var PANEL = "dsh-decision-router";
var API = "/dsh-auto-router/api";
var routeLabels = (data) => Object.fromEntries((data?.candidates ?? []).map((candidate) => [candidate.id, candidate.label ?? candidate.id]));
async function api(route, data) {
  const response = await fetch(API + route, { credentials: "same-origin", ...data === void 0 ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) } });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message ?? "\u8BF7\u6C42\u5931\u8D25");
  return result;
}
function Icon({ size = 20 }) {
  return /* @__PURE__ */ import_react5.default.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", "aria-hidden": "true" }, /* @__PURE__ */ import_react5.default.createElement("path", { d: "M4 12h6m0 0 4-6h6m-10 6 4 6h6" }), /* @__PURE__ */ import_react5.default.createElement("circle", { cx: "3", cy: "12", r: "1.5" }), /* @__PURE__ */ import_react5.default.createElement("circle", { cx: "21", cy: "6", r: "1.5" }), /* @__PURE__ */ import_react5.default.createElement("circle", { cx: "21", cy: "18", r: "1.5" }));
}
function useStateFeed() {
  const [data, setData] = (0, import_react5.useState)(null);
  const [error, setError] = (0, import_react5.useState)("");
  async function refresh() {
    try {
      const next = await api("/state");
      setData(next);
      setError("");
      return next;
    } catch (error2) {
      setError(error2.message);
    }
  }
  (0, import_react5.useEffect)(() => {
    let active = true;
    let pending = false;
    const tick = async () => {
      if (pending) return;
      pending = true;
      try {
        const next = await api("/state");
        if (active) {
          setData(next);
          setError("");
        }
      } catch (error2) {
        if (active) setError(error2.message);
      } finally {
        pending = false;
      }
    };
    void tick();
    const timer = setInterval(tick, 2500);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  return { data, error, refresh };
}
function Page({ actions }) {
  const { data, error } = useStateFeed();
  const localTrial = data?.candidates.length > 0 && data.candidates.every((candidate) => candidate.provider === "local-fixture");
  const rows = data?.receipts ?? [];
  const sessions = Object.fromEntries((data?.sessions ?? []).map((session) => [session.id, session.title]));
  const recent = rows.at(-1);
  const elapsed = rows.filter((item) => item.backendModel).map((item) => item.elapsedMs).sort((a, b) => a - b);
  const fallbackCount = rows.filter((row) => !["system-one", "manual-pin"].includes(row.reason)).length;
  const decisionId = data?.modelSettings?.decisionModel ?? data?.decisionModel ?? "laya";
  const decisionStatus = decisionModelStatus(data?.service, decisionId);
  return /* @__PURE__ */ import_react5.default.createElement("section", { className: "dar", "aria-label": "\u81EA\u52A8\u9009\u6A21" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "dar-shell" }, /* @__PURE__ */ import_react5.default.createElement("header", { className: "dar-header" }, /* @__PURE__ */ import_react5.default.createElement("div", null, /* @__PURE__ */ import_react5.default.createElement("div", { className: "dar-kicker" }, /* @__PURE__ */ import_react5.default.createElement(Icon, { size: 18 }), " \u667A\u80FD\u8DEF\u7531"), /* @__PURE__ */ import_react5.default.createElement("h1", null, "\u81EA\u52A8\u9009\u6A21"), /* @__PURE__ */ import_react5.default.createElement("p", null, "\u67E5\u770B\u51B3\u7B56\u72B6\u6001\u3001\u5DF2\u914D\u7F6E\u8DEF\u7531\u548C\u6267\u884C\u8BB0\u5F55\u3002")), /* @__PURE__ */ import_react5.default.createElement("div", { className: "dar-header-actions" }, /* @__PURE__ */ import_react5.default.createElement("span", { className: `dar-status ${decisionStatus.ready ? "is-ready" : ""} ${decisionId === "systemone-api" ? "is-cloud" : ""}` }, /* @__PURE__ */ import_react5.default.createElement("i", null), decisionStatus.text), /* @__PURE__ */ import_react5.default.createElement("button", { className: "dar-button", onClick: () => actions.back() }, "\u8FD4\u56DE\u5BF9\u8BDD"))), error && /* @__PURE__ */ import_react5.default.createElement("div", { className: "dar-error", role: "alert" }, error), !data ? /* @__PURE__ */ import_react5.default.createElement("p", { className: "dar-empty" }, "\u6B63\u5728\u8FDE\u63A5\u9879\u76EE\u5185 DSH\u2026") : /* @__PURE__ */ import_react5.default.createElement(import_react5.default.Fragment, null, /* @__PURE__ */ import_react5.default.createElement("div", { className: "dar-stats" }, /* @__PURE__ */ import_react5.default.createElement("div", null, /* @__PURE__ */ import_react5.default.createElement("span", null, "\u5DF2\u8BB0\u5F55\u8DEF\u7531"), /* @__PURE__ */ import_react5.default.createElement("strong", null, rows.length, /* @__PURE__ */ import_react5.default.createElement("small", null, "\u6761"))), /* @__PURE__ */ import_react5.default.createElement("div", null, /* @__PURE__ */ import_react5.default.createElement("span", null, "\u51B3\u7B56\u8017\u65F6\u4E2D\u4F4D\u6570"), /* @__PURE__ */ import_react5.default.createElement("strong", null, elapsed.length ? elapsed[Math.floor((elapsed.length - 1) / 2)] : "\u2014", /* @__PURE__ */ import_react5.default.createElement("small", null, "\u6BEB\u79D2"))), /* @__PURE__ */ import_react5.default.createElement("div", null, /* @__PURE__ */ import_react5.default.createElement("span", null, "\u89E6\u53D1\u56DE\u9000"), /* @__PURE__ */ import_react5.default.createElement("strong", null, fallbackCount, /* @__PURE__ */ import_react5.default.createElement("small", null, "\u6B21"))), /* @__PURE__ */ import_react5.default.createElement("div", null, /* @__PURE__ */ import_react5.default.createElement("span", null, "\u6700\u8FD1\u6267\u884C\u6A21\u578B"), /* @__PURE__ */ import_react5.default.createElement("strong", { className: "dar-stat-name" }, modelLabel(recent?.applied.provider, recent?.applied.model)))), /* @__PURE__ */ import_react5.default.createElement("div", { className: "dar-card-heading dar-overview-heading" }, /* @__PURE__ */ import_react5.default.createElement("h2", null, "\u5DF2\u914D\u7F6E ", data.candidates.length, " \u4E2A\u8DEF\u7531\u6863\u4F4D"), /* @__PURE__ */ import_react5.default.createElement("span", { className: "dar-muted" }, "\u5728\u300C\u8BBE\u7F6E \u2192 \u81EA\u52A8\u9009\u6A21\u300D\u4E2D\u4FEE\u6539")), /* @__PURE__ */ import_react5.default.createElement("div", { className: "dar-candidates" }, data.candidates.map((candidate) => /* @__PURE__ */ import_react5.default.createElement("article", { key: candidate.id, className: "dar-model" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "dar-model-title" }, /* @__PURE__ */ import_react5.default.createElement("h3", null, candidate.label), /* @__PURE__ */ import_react5.default.createElement("span", null, effortLabel(candidate.reasoningEffort))), /* @__PURE__ */ import_react5.default.createElement("p", null, candidate.description, candidate.extraDescription ? ` ${candidate.extraDescription}` : ""), /* @__PURE__ */ import_react5.default.createElement("div", { className: "dar-model-footer" }, /* @__PURE__ */ import_react5.default.createElement("code", null, modelLabel(candidate.provider, candidate.model)), /* @__PURE__ */ import_react5.default.createElement("span", null, candidate.provider === "local-fixture" ? "\u672C\u5730\u6D4B\u8BD5\u6267\u884C\u7AEF" : candidate.provider))))), /* @__PURE__ */ import_react5.default.createElement("section", { className: "dar-card dar-records", "aria-label": "\u8DEF\u7531\u8BB0\u5F55" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "dar-card-heading" }, /* @__PURE__ */ import_react5.default.createElement("h2", null, "\u8DEF\u7531\u8BB0\u5F55"), /* @__PURE__ */ import_react5.default.createElement("span", { className: "dar-muted" }, "\u5168\u90E8\u5BF9\u8BDD \xB7 \u6700\u8FD1 ", rows.length, " \u6761")), /* @__PURE__ */ import_react5.default.createElement("p", { className: "dar-subtitle" }, "\u6309\u65F6\u95F4\u5012\u5E8F\u5C55\u793A\u672C\u6B21\u670D\u52A1\u8FD0\u884C\u671F\u95F4\u7684\u8BB0\u5F55\uFF0C\u6700\u591A\u4FDD\u7559 200 \u6761\u3002"), rows.length === 0 ? /* @__PURE__ */ import_react5.default.createElement("div", { className: "dar-empty" }, /* @__PURE__ */ import_react5.default.createElement(Icon, { size: 30 }), /* @__PURE__ */ import_react5.default.createElement("p", null, "\u8FD8\u6CA1\u6709\u8DEF\u7531\u8BB0\u5F55"), /* @__PURE__ */ import_react5.default.createElement("span", null, "\u5728\u5BF9\u8BDD\u4E2D\u9009\u62E9\u201C\u81EA\u52A8\u201D\u5E76\u53D1\u9001\u4EFB\u52A1\u540E\uFF0C\u8BB0\u5F55\u4F1A\u663E\u793A\u5728\u8FD9\u91CC\u3002")) : /* @__PURE__ */ import_react5.default.createElement("div", { className: "dar-record-table-wrap" }, /* @__PURE__ */ import_react5.default.createElement("table", { className: "dar-record-table" }, /* @__PURE__ */ import_react5.default.createElement("thead", null, /* @__PURE__ */ import_react5.default.createElement("tr", null, /* @__PURE__ */ import_react5.default.createElement("th", { scope: "col" }, "\u65F6\u95F4"), /* @__PURE__ */ import_react5.default.createElement("th", { scope: "col" }, "\u5BF9\u8BDD / \u8F6E\u6B21"), /* @__PURE__ */ import_react5.default.createElement("th", { scope: "col" }, "\u6267\u884C\u6A21\u578B / \u63A8\u7406\u5F3A\u5EA6"), /* @__PURE__ */ import_react5.default.createElement("th", { scope: "col" }, "\u51B3\u7B56\u6A21\u578B"), /* @__PURE__ */ import_react5.default.createElement("th", { scope: "col" }, "\u8DEF\u7531\u539F\u56E0"), /* @__PURE__ */ import_react5.default.createElement("th", { scope: "col" }, "\u8017\u65F6"))), /* @__PURE__ */ import_react5.default.createElement("tbody", null, rows.slice().reverse().map((row, index) => /* @__PURE__ */ import_react5.default.createElement("tr", { key: `${row.sessionId}-${row.turn}-${row.step}-${row.createdAt}-${index}` }, /* @__PURE__ */ import_react5.default.createElement("td", null, /* @__PURE__ */ import_react5.default.createElement("time", { dateTime: row.createdAt }, row.createdAt ? new Date(row.createdAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "\u2014")), /* @__PURE__ */ import_react5.default.createElement("td", null, /* @__PURE__ */ import_react5.default.createElement("span", { className: "dar-record-session", title: sessions[row.sessionId] ?? row.sessionId }, sessions[row.sessionId] ?? "\u672A\u547D\u540D\u5BF9\u8BDD"), /* @__PURE__ */ import_react5.default.createElement("small", null, "\u7B2C ", row.turn, " \u8F6E")), /* @__PURE__ */ import_react5.default.createElement("td", null, /* @__PURE__ */ import_react5.default.createElement("span", null, modelLabel(row.applied.provider, row.applied.model)), /* @__PURE__ */ import_react5.default.createElement("small", null, "\u63A8\u7406\u5F3A\u5EA6\uFF1A", effortLabel(row.applied.reasoningEffort))), /* @__PURE__ */ import_react5.default.createElement("td", null, row.backendModel ? decisionModelLabel(row.backendModel) : "\u2014", row.decisionLocation === "cloud" && /* @__PURE__ */ import_react5.default.createElement("small", { className: "dar-cloud-text" }, "\u4E91\u7AEF API")), /* @__PURE__ */ import_react5.default.createElement("td", null, row.mode === "shadow" ? "\u4EC5\u89C2\u5BDF \xB7 " : "", reasonLabel(row.reason)), /* @__PURE__ */ import_react5.default.createElement("td", { className: "dar-record-elapsed" }, row.elapsedMs, " \u6BEB\u79D2"))))))), /* @__PURE__ */ import_react5.default.createElement("footer", { className: "dar-footer" }, "\u9879\u76EE\u5185 DSH \xB7 ", decisionId === "systemone-api" ? "\u5DF2\u542F\u7528\u4E91\u7AEF\u51B3\u7B56 API" : "\u9009\u6A21\u51B3\u7B56\u5728\u672C\u673A\u5B8C\u6210", localTrial ? " \xB7 \u6267\u884C\u7AEF\u4E3A\u672C\u5730\u6D4B\u8BD5\u66FF\u8EAB" : " \xB7 \u6267\u884C\u6A21\u578B\u7531\u8DEF\u7531\u914D\u7F6E\u6307\u5B9A"))));
}
function HeaderButton({ boundSessionId, open }) {
  const { data } = useStateFeed();
  const labels = routeLabels(data);
  const session = data?.sessions.find((item) => item.id === boundSessionId);
  const latest = data?.receipts.filter((item) => item.sessionId === boundSessionId).at(-1);
  const name = session?.autoSelected ? session.mode === "off" ? "\u81EA\u52A8\u9009\u6A21\u5DF2\u6682\u505C" : session.mode === "shadow" ? "\u9009\u6A21\u89C2\u5BDF\u4E2D" : session.pin ? "\u81EA\u52A8\u6A21\u5F0F \xB7 \u6307\u5B9A\u6863\u4F4D" : "\u81EA\u52A8\u9009\u6A21" : "\u5F53\u524D\u4F7F\u7528\u6307\u5B9A\u6A21\u578B";
  const selected = session?.autoSelected ? session.pin ? labels[session.pin] : latest && modelLabel(latest.applied.provider, latest.applied.model) : session?.selected && modelLabel(session.selected.provider, session.selected.model);
  return /* @__PURE__ */ import_react5.default.createElement("button", { className: "dar-header-button", onClick: open, title: "\u67E5\u770B\u81EA\u52A8\u9009\u6A21\u72B6\u6001\u4E0E\u8BB0\u5F55" }, /* @__PURE__ */ import_react5.default.createElement(Icon, { size: 16 }), /* @__PURE__ */ import_react5.default.createElement("span", null, name, selected ? ` \xB7 ${selected}` : ""));
}
function SettingsPage({ actions, close }) {
  const { data, error, refresh } = useStateFeed();
  return /* @__PURE__ */ import_react5.default.createElement("section", { className: "dar dar-settings-subpage", "aria-label": "\u81EA\u52A8\u9009\u6A21\u8BBE\u7F6E" }, /* @__PURE__ */ import_react5.default.createElement("h1", null, "\u81EA\u52A8\u9009\u6A21"), /* @__PURE__ */ import_react5.default.createElement("p", { className: "dar-settings-lead" }, "\u9009\u62E9\u51B3\u7B56\u65B9\u5F0F\uFF0C\u5B9A\u4E49\u5404\u6267\u884C\u6A21\u578B\u7684\u4EFB\u52A1\u5206\u5DE5\u3002"), error && /* @__PURE__ */ import_react5.default.createElement("div", { className: "dar-error", role: "alert" }, error), /* @__PURE__ */ import_react5.default.createElement(ModelSettings, { request: api, current: data?.modelSettings, service: data?.service, onClose: close, onSaved: (saved) => {
    actions.modelsSaved(saved);
    void refresh();
  } }));
}
var inject = ["slots", "layout", "uiWorkspace", "locale", "shortcuts"];
function apply(ctx) {
  installChineseLocale(ctx);
  installUnsavedGuardShortcuts(ctx);
  let sidebarVisible = true;
  let sidebarRevision = -1;
  let updateSidebar = () => {
  };
  const syncSettings = (saved) => {
    if (saved.revision < sidebarRevision) return;
    sidebarRevision = saved.revision;
    sidebarVisible = saved.sidebarEnabled;
    updateSidebar();
  };
  ctx.effect(() => {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.append(style);
    return () => style.remove();
  });
  const actions = { back: () => ctx.layout.selectPanel(null), modelsSaved: syncSettings };
  ctx.slots.inject("main", () => ctx.slots.register({ name: "main", key: PANEL, inject: () => ({ actions }) }, Page));
  ctx.slots.inject("settings.section", () => ctx.slots.register({ name: "settings.section", id: PANEL, order: 15, label: () => "\u81EA\u52A8\u9009\u6A21", inject: () => ({ actions }) }, SettingsPage));
  ctx.slots.inject("sidebar.panellist", () => {
    let dispose;
    let active = true;
    let pending = false;
    updateSidebar = () => {
      if (!active) return;
      if (sidebarVisible && !dispose) dispose = ctx.slots.register({ name: "sidebar.panellist", id: PANEL, order: 36, label: () => "\u81EA\u52A8\u9009\u6A21" }, Icon);
      if (!sidebarVisible && dispose) {
        dispose();
        dispose = void 0;
      }
    };
    const sync = async () => {
      if (pending) return;
      pending = true;
      try {
        const data = await api("/state");
        if (active) syncSettings(data.modelSettings);
      } catch {
      } finally {
        pending = false;
      }
    };
    void sync();
    const timer = setInterval(sync, 2500);
    return () => {
      active = false;
      clearInterval(timer);
      dispose?.();
      updateSidebar = () => {
      };
    };
  });
  ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register({ name: "conversation.session.header.actions", id: PANEL, order: 25, inject: (sessionId) => ({ boundSessionId: sessionId, open: () => ctx.layout.selectPanel(PANEL) }) }, HeaderButton));
}

return module.exports;}});
