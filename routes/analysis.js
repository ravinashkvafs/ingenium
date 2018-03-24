process.on('message', message => {
    
    var len = message.user.length;
    var f_len = 0;
    var a_len = 0;
    
	if(message.analysis_for == 1)
		while(len > 0 ){

			if(message.user[len-1].are_you.facilitator)
				f_len++;
			if(message.user[len-1].are_you.admin)
				a_len++;

			len--;
		}
    
    var sending = { f_len: f_len,
                    a_len: a_len,
                    u_len: message.user.length,
                    months: [],
                    variant_profile_num: message.variant_profile_num,
				   	fullAuth: message.fullAuth
                  };
    
    //console.log(message.dates[0].important_date.registration);
    var i = 0;
            while(i < message.dates.length){
                //console.log(message.dates[i].important_date.registration);
                sending.months.push(message.dates[i].important_date.registration);
                i++;
            }
    //console.log(sending);
    process.send(sending);
});