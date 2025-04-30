class Account {
    constructor() {
        this.initEvents();
    }
    
    initEvents() {
        // Handle tab clicks
        $('#about-tab').click((e) => this.handleAboutTab(e));
        $('#password-tab').click((e) => this.handlePasswordTab(e));
        // Set active tab based on URL hash or default to about
        this.setInitialActiveTab();
    }
    
    handleAboutTab(e) {
        e.preventDefault();
        // Update UI
        $('#about-tab').addClass('active show');
        $('#password-tab').removeClass('active show');
        $('#about').addClass('active show');
        $('#password').removeClass('active show');
        // Update URL hash
        window.location.hash = 'about';
    }
    
    handlePasswordTab(e) {
        e.preventDefault();
        // Update UI
        $('#password-tab').addClass('active show');
        $('#about-tab').removeClass('active show');
        $('#password').addClass('active show');
        $('#about').removeClass('active show');
        
        // Update URL hash
        window.location.hash = 'password';
    }
    setInitialActiveTab() {
        // Check URL hash to determine which tab to show
        const hash = window.location.hash;
        if (hash === '#password') {
            this.handlePasswordTab({ preventDefault: () => {} });
        } else {
            this.handleAboutTab({ preventDefault: () => {} });
        }
    }
}

$(document).ready(() => {
    new Account();
});