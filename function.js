function getDate(){
    //get current date in format (yyyy-mm-dd hh:mm:ss)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return formattedDate;
}

function getNextWeekday(date) {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
  
    while (nextDate.getDay() === 0 || nextDate.getDay() === 6) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
  
    return nextDate;
  }

module.exports = {
    getDate,
    getNextWeekday
}