const { format,register  } = require('timeago.js');
const helpers = {};
register('es_ES', (number, index, total_sec) => [
  ['ahora', 'ahorita'],
  ['hace %s segundos', 'en %s segundos'],
  ['hace 1 minuto', 'en 1 minuto'],
  ['hace %s minutos', 'en %s minutos'],
  ['hace 1 hora', 'en 1 hora'],
  ['hace %s horas', 'in %s horas'],
  ['hace 1 dia', 'en 1 dia'],
  ['hace %s dias', 'en %s dias'],
  ['hace 1 semana', 'en 1 semana'],
  ['hace %s semanas', 'en %s semanas'],
  ['1 mes', 'en 1 mes'],
  ['hace %s meses', 'en %s meses'],
  ['hace 1 año', 'en 1 año'],
  ['hace %s años', 'en %s años']
][index]);

register('es_ES2', (number, index, total_sec) => [
  ['justo ahora', 'ahora mismo'],
  ['durante %s segundos', 'en %s segundos'],
  ['durante 1 minuto', 'en 1 minuto'],
  ['durante %s minutos', 'en %s minutos'],
  ['durante 1 hora', 'en 1 hora'],
  ['durante %s horas', 'in %s horas'],
  ['durante 1 dia', 'en 1 dia'],
  ['durante %s dias', 'en %s dias'],
  ['durante 1 semana', 'en 1 semana'],
  ['durante %s semanas', 'en %s semanas'],
  ['1 mes', 'en 1 mes'],
  ['durante %s meses', 'en %s meses'],
  ['durante 1 año', 'en 1 año'],
  ['durante %s años', 'en %s años']
][index]);

helpers.timeagoSpCerrado = timestamp => {
  return format(timestamp, 'es_ES');
}

helpers.timeagoSp = timestamp => {
  return format(timestamp, 'es_ES2');
}
helpers.timeago = (fecha) => {
  var timestamp = new Date(fecha);
  return format(timestamp);
}

helpers.formatearSp = (fecha) => {
  if(fecha!=null){
    var timestamp = new Date(fecha);
    mnth = ("0" + (timestamp.getMonth() + 1)).slice(-2),
      day = ("0" + timestamp.getDate()).slice(-2);
    return [day, mnth, timestamp.getFullYear()].join("/");
  }else{
    return null;
  }

}

//Este es el formateo necesario para encajar una fecha en un input de type="date"
helpers.formatearEn = (fecha) => {
  var timestamp = new Date(fecha);
  mnth = ("0" + (timestamp.getMonth() + 1)).slice(-2),
    day = ("0" + timestamp.getDate()).slice(-2);
  return [timestamp.getFullYear(), mnth, day].join("-");
}


helpers.suma = (balizas) => {
  var total = 0;
  balizas.forEach(element => {
    total++;
  });
  return total;
}

helpers.esAdmin = (value) => {
  return (value == "admin");
}

helpers.esTecnico = (value) => {
  return (value == "san");
}
helpers.when =(operand_1, operator, operand_2, options)=> {
  var operators = {
    'eq': function(l,r) { return l == r; },
    'noteq': function(l,r) { return l != r; },
    'gt': function(l,r) { return Number(l) > Number(r); },
    'or': function(l,r) { return l || r; },
    'and': function(l,r) { return l && r; },
    '%': function(l,r) { return (l % r) === 0; }
   }
   , result = operators[operator](operand_1,operand_2);
 
   if (result) return options.fn(this);
   else  return options.inverse(this);
}
module.exports = helpers;