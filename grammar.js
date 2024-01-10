function commaSepList1 (itemRule) {
  return seq(itemRule, repeat(seq(',', itemRule)))
}

module.exports = grammar({
  name: 'BluespecSystemVerilog'
, rules: {
  // outter-most bsv package
    bsv_package: $ => seq( 'package', field('name', $.bsv_packageIde), ';'
                         , repeat($.bsv_exportDecl)
                         , repeat($.bsv_importDecl)
                         , repeat($.bsv_packageStmt)
                         , 'endpackage', optional(seq(':', $.bsv_packageIde)) )
  , bsv_packageIde: $ => $._bsv_Identifier
  // exports
  , bsv_exportDecl: $ => seq( 'export', commaSepList1($.bsv_exportItem), ';')
  , bsv_exportItem: $ => choice( seq($._bsv_identifier, optional('(..)'))
                               , seq($._bsv_Identifier, optional('(..)'))
                               , seq($.bsv_packageIde, '::', '\*'))
  // imports
  , bsv_importDecl: $ => seq( 'import', commaSepList1($.bsv_importItem), ';')
  , bsv_importItem: $ => seq($.bsv_packageIde, '::', '*')
  // package statements
  , bsv_packageStmt: $ => 'TODO'
  // identifiers
  , _bsv_identifier: $ => /[a-z][a-zA-Z0-9$_]*/
  , _bsv_Identifier: $ => /[A-Z][a-zA-Z0-9$_]*/
  }
});
