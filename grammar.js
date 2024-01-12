sepList1 = (sep, item) => seq(item, repeat(seq(sep, item)))
commaSepList1 = item => sepList1(',', item)
sepList = (sep, item) => optional(sepList1(sep, item))
commaSepList = item => sepList(',', item)

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
  , bsv_exportDecl: $ => seq('export', commaSepList1($.bsv_exportItem), ';')
  , bsv_exportItem: $ => choice( seq($._bsv_identifier, optional('(..)'))
                               , seq($._bsv_Identifier, optional('(..)'))
                               , seq($.bsv_packageIde, '::', '*'))
  // imports
  , bsv_importDecl: $ => seq('import', commaSepList1($.bsv_importItem), ';')
  , bsv_importItem: $ => seq($.bsv_packageIde, '::', '*')
  // package statements
  , bsv_packageStmt: $ => choice( $.bsv_moduleDef
                                // TODO , $.bsv_interfaceDecl
                                // TODO , $.bsv_typeDef
                                // TODO , $.bsv_varDecl
                                // TODO , $.bsv_varAssign
                                , $.bsv_functionDef
                                // TODO , $.bsv_typeclassDef
                                // TODO , $.bsv_typeclassInstanceDef
                                // TODO , $.bsv_externModuleImport
                                )
  // module definition
  , bsv_moduleDef: $ => seq( optional($.bsv_attributeInstances)
                           , $.bsv_moduleProto
                           , repeat($.bsv_moduleStmt)//repeat1($.bsv_moduleStmt)
                           , 'endmodule', optional(seq(':', $._bsv_identifier)) )
  , bsv_moduleProto: $ => seq( 'module'
                             , optional(seq('[', $.bsv_type, ']'))
                             , $._bsv_identifier
                             , optional($.bsv_moduleFormalParams)
                             , '(', optional($.bsv_moduleFormalArgs), ')'
                             , optional($.bsv_provisos)
                             , ';' )
  , bsv_moduleFormalParams: $ =>
      seq('#', '(', commaSepList1($.bsv_moduleFormalParam), ')')
  , bsv_moduleFormalParam: $ => seq( optional($.bsv_attributeInstances)
                                   , optional('parameter')
                                   , $.bsv_type, $._bsv_identifier )
  , bsv_moduleFormalArgs: $ =>
      choice( seq(optional($.bsv_attributeInstances), $.bsv_type)
            , commaSepList1(seq( optional($.bsv_attributeInstances)
                               , $.bsv_type, $._bsv_identifier )) )
  // module statements
  , bsv_moduleStmt: $ => 'TODO'
  // function definition
  , bsv_functionDef: $ =>
      seq( optional($.bsv_attributeInstances)
         , $.bsv_functionProto
         , $.bsv_functionBody
         , 'endfunction', optional(seq(':', $._bsv_identifier)) )
  , bsv_functionProto: $ =>
      seq( 'function', $.bsv_type, $._bsv_identifier
         , '(', commaSepList(seq($.bsv_type, $._bsv_identifier)), ')'
         , optional($.bsv_provisos), ';' )
  , bsv_functionBody: $ => repeat1($.bsv_functionBodyStmt)
  //, bsv_functionBody: $ => choice( $.bsv_actionBlock
  //                               , $.bsv_actionValueBlock
  //                               , repeat($.bsv_functionBodyStmt) )
  , bsv_functionBodyStmt: $ =>
      choice( $.bsv_returnStmt
            //, $.bsv_varDecl
            //, $.bsv_varAssign
            //, $.bsv_functionDef
            //, $.bsv_moduleDef
            , 'TODO' )
  , bsv_returnStmt: $ => seq('return', $.bsv_expression, ';')
  // expressions
  , bsv_expression: $ =>
      choice($.bsv_condExpr, $.bsv_operatorExpr, $.bsv_exprPrimary)
  , bsv_exprPrimary: $ =>
      choice( $._bsv_identifier
            // TODO, $.bsv_intLiteral
            // TODO, $.bsv_realLiteral
            // TODO, $.bsv_stringLiteral
            // TODO, $.bsv_systemFunctionCall
            // TODO, '?'
            // TODO, $.bsv_bitConcat
            // TODO, $.bsv_bitSelect
            // TODO, $.bsv_beginEndExpr
            // TODO, $.bsv_actionBlock
            // TODO, $.bsv_actionValueBlock
            // TODO, $.bsv_functionCall
            // TODO, $.bsv_methodCall
            // TODO, $.bsv_typeAssertion
            // TODO, $.bsv_structExpr
            // TODO, seq($.bsv_exprPrimary, '.', _bsv_identifier)
            // TODO, $.bsv_taggedUnionExpr
            // TODO, $.bsv_interfaceExpr
            // TODO, $.bsv_rulesExpr
            // TODO, $.bsv_seqFsmStmt
            // TODO, $.bsv_parFsmStmt
            // TODO, seq('valueof', '(', bsv_type, ')')
            // TODO, seq('valueOf', '(', bsv_type, ')')
            // TODO, seq('(', bsv_expression, ')')
            )
  , bsv_condExpr: $ =>
      prec(9, seq( $.bsv_condPredicate, '?'
                 , prec(10, $.bsv_expression), ':'
                 , prec(10, $.bsv_expression) ))
  , bsv_condPredicate: $ => sepList1('&&&', prec.right(9, $.bsv_exprOrCondPattern))
  , bsv_exprOrCondPattern: $ =>
      choice($.bsv_expression, seq($.bsv_expression, 'matches', $.bsv_pattern))
  , bsv_operatorExpr: $ =>
      choice( prec(10, seq($.bsv_unop, $.bsv_expression))
            , prec.left(1, seq($.bsv_expression, $.bsv_binop, $.bsv_expression)) )
  , bsv_unop: $ =>
      choice("+", "-", "!", "~", "&", "~&", "|", "~|", "^", "^~", "~^")
  , bsv_binop: $ =>
      prec.left(choice( "*", "/", "%", "+", "-", "<<", ">>"
                      , "<=", ">=", "<", ">", "==", "!="
                      , "&", "^", "^~", "~^", "|", "&&", "||" ))
  // types
  , bsv_type: $ =>
      choice( $.bsv_typePrimary
            , seq($.bsv_typePrimary, '(', commaSepList1($.bsv_type), ')') )
  , bsv_typePrimary: $ =>
      choice( seq( $.bsv_typeIde
                 , optional(seq('#', '(', commaSepList1($.bsv_type), ')')) )
            , $.bsv_typeVar
            , $.bsv_typeNat
            , seq('bit', '[', $.bsv_typeNat, ':', $.bsv_typeNat, ']') )
  , bsv_typeVar: $ => $._bsv_identifier
  , bsv_typeIde: $ => $._bsv_Identifier
  , bsv_typeNat: $ => /[0-9]+/
  // pattern matching
  //, bsv_pattern: $ => choice( seq('.', token.immediate($._bsv_identifier))
  , bsv_pattern: $ => choice( seq('.', $._bsv_identifier)
                            , '.*'
                            , $.bsv_constantPattern
                            , $.bsv_taggedUnionPattern
                            , $.bsv_structPattern
                            , $.bsv_tuplePattern )
  , bsv_constantPattern: $ => choice( $.bsv_intLiteral
                                    , $.bsv_realLiteral
                                    , $.bsv_stringLiteral
                                    , $._bsv_Identifier )
  , bsv_taggedUnionPattern: $ =>
      seq('tagged', $._bsv_Identifier, optional($.bsv_pattern))
  , bsv_structPattern: $ =>
      seq( $._bsv_Identifier, '{'
         , commaSepList1(seq($._bsv_identifier, ':', $.bsv_pattern))
         , '}' )
  , bsv_tuplePattern: $ => seq('{', commaSepList1($.bsv_pattern), '}')
  // typeclass
  , bsv_typeclassIde: $ => $._bsv_Identifier
  // provisos
  , bsv_provisos: $ => seq('provisos', '(', commaSepList1($.bsv_proviso), ')')
  , bsv_proviso: $ =>
      seq($.bsv_typeclassIde, '#', '(', commaSepList1($.bsv_type), ')')
  // attributes, guiding the compiler
  , bsv_attributeInstances: $ => repeat1($.bsv_attributeInstance)
  , bsv_attributeInstance: $ => seq('(*', commaSepList1($.bsv_attrSpec), '*)')
  , bsv_attrSpec: $ => seq($.bsv_attrName, optional(seq('=', $.bsv_expression)))
  , bsv_attrName: $ => choice($._bsv_identifier, $._bsv_Identifier)
  // integer literals
  , bsv_intLiteral: $ => choice( "'0"
                               , "'1"
                               , $.bsv_sizedIntLiteral
                               , $.bsv_unsizedIntLiteral )
  , bsv_sizedIntLiteral: $ => seq($.bsv_bitWidth, $.bsv_baseLiteral)
  , bsv_unsizedIntLiteral: $ =>
      choice( seq(optional($.bsv_sign), $.bsv_baseLiteral)
            , seq(optional($.bsv_sign), repeat1(/[0-9]/)) )
  , bsv_baseLiteral: $ =>
      choice( /[0-9]+/
            , seq(/'[dD]/, /[0-9_]*/)
            , seq(/'[hH]/, /[0-9a-fA-F_]*/)
            , seq(/'[oO]/, /[0-7_]*/)
            , seq(/'[bB]/, /[01_]*/)
            )
  , bsv_decNum: $ => /[0-9][0-9_]*/
  , bsv_bitWidth: $ => /[0-9]*/
  , bsv_sign: $ => /[\+\-]/
  // real literals
  , bsv_realLiteral: $ => choice( /[0-9][0-9_]*(.[0-9_]*)?[eE][\+\-]?[0-9_]*/
                                , /[0-9][0-9_]*.[0-9_]*/ )
  // string literals
  , bsv_stringLiteral: $ => seq('"', /.*/, '"')
  // identifiers
  , _bsv_identifier: $ => /[a-z][a-zA-Z0-9$_]*/
  , _bsv_Identifier: $ => /[A-Z][a-zA-Z0-9$_]*/
  // comments
  , _bsv_line_comment: $ => seq('//', /.*\n/)
  , _bsv_block_comment: $ => seq('/*', repeat(/./), '*/')
  }
, extras: $ => [/\s/, $._bsv_line_comment, $._bsv_block_comment]
});
