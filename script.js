
document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const signupContainer = document.getElementById('signup-container');
    const tracker = document.getElementById('tracker');
    const userSpan = document.getElementById('user-span');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const expenseForm = document.getElementById('expense-form');
    const expenseList = document.getElementById('expense-list');
    const updatedBal = document.getElementById('updatedBal');
    const updatedInc = document.getElementById('updatedInc');
    const updatedExp = document.getElementById('updatedExp');
    const filterCategory = document.getElementById('filter-category');
    const filterStartDate = document.getElementById('filter-start-date');
    const filterEndDate = document.getElementById('filter-end-date');
    const itemType = document.getElementById('itemType');
    const expenseCategory = document.getElementById('expense-category');

    let users = JSON.parse(localStorage.getItem('users')) || [];
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (currentUser) {
        loginContainer.style.display = 'none';
        tracker.style.display = 'block';
        userSpan.textContent = currentUser.username;
        renderExpenses();
        updateSummary();
    }

    document.getElementById('show-signup').addEventListener('click', () => {
        loginContainer.style.display = 'none';
        signupContainer.style.display = 'block';
    });

    document.getElementById('show-login').addEventListener('click', () => {
        signupContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('//https://dailly-expense-tracker.netlify.app/#'), {
                method: 'Post',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (response.ok) {
                currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                loginContainer.style.display = 'none';
                tracker.style.display = 'block';
                userSpan.textContent = currentUser.username;
                fetchExpenses();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('signup-username').value;
        const password = document.getElementById('signup-password').value;
        const email = document.getElementById('signup-email').value;

        try {
            const response = await fetch('//https://dailly-expense-tracker.netlify.app/#', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email })
            });

            const data = await response.json();
            if (response.ok) {
                alert('Signup successful! Please log in.');
                signupContainer.style.display = 'none';
                loginContainer.style.display = 'block';
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('expense-name').value;
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const date = document.getElementById('expense-date').value;
        const category = document.getElementById('expense-category').value;
        const type = document.getElementById('itemType').value;

        const newExpense = { name, amount, date, category, type, user: currentUser.username };
        expenses.push(newExpense);
        localStorage.setItem('expenses', JSON.stringify(expenses));
        renderExpenses();
        updateSummary();
        expenseForm.reset();
    });

    filterCategory.addEventListener('change', renderExpenses);
    filterStartDate.addEventListener('change', renderExpenses);
    filterEndDate.addEventListener('change', renderExpenses);

    itemType.addEventListener('change', updateCategoryOptions);

    function updateCategoryOptions() {
        const type = itemType.value;
        expenseCategory.innerHTML = '';

        if (type === '0') { // Expense
            expenseCategory.innerHTML = `
                <option value="" disabled selected>Select Category</option>
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Other">Other</option>
            `;
        } else if (type === '1') { // Income
            expenseCategory.innerHTML = `
                <option value="" disabled selected>Select Category</option>
                <option value="Home">Home</option>
                <option value="Bank">Bank</option>
            `;
        }
    }

    async function fetchExpenses() {
        try {
            const response = await fetch(`http://localhost:5000/expenses?user=${currentUser.username}`);
            const expenses = await response.json();
            renderExpenses(expenses);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        }
    }

    function renderExpenses(expenses) {
        expenseList.innerHTML = '';
        const filteredExpenses = expenses.filter(expense => {
            const isUserExpense = expense.user === currentUser.username;
            const isCategoryMatch = filterCategory.value === 'All' || expense.category === filterCategory.value;
            const isStartDateMatch = !filterStartDate.value || new Date(expense.date) >= new Date(filterStartDate.value);
            const isEndDateMatch = !filterEndDate.value || new Date(expense.date) <= new Date(filterEndDate.value);
            return isUserExpense && isCategoryMatch && isStartDateMatch && isEndDateMatch;
        });

        filteredExpenses.forEach((expense, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${expense.name}</td>
                <td>${expense.amount.toFixed(2)}</td>
                <td>${expense.category}</td>
                <td>${new Date(expense.date).toLocaleDateString()}</td>
                <td>${expense.type === '0' ? 'Expense' : 'Income'}</td>
                <td><button class="edit-btn" onclick="editExpense(${index})">Edit</button></td>
                <td><button class="delete-btn" onclick="deleteExpense(${index})">Delete</button></td>
            `;
            expenseList.appendChild(row);
        });
    }

    function updateSummary() {
        const userExpenses = expenses.filter(expense => expense.user === currentUser.username);
        const totalIncome = userExpenses.filter(expense => expense.type === '1').reduce((sum, expense) => sum + expense.amount, 0);
        const totalExpenses = userExpenses.filter(expense => expense.type === '0').reduce((sum, expense) => sum + expense.amount, 0);
        const balance = totalIncome - totalExpenses;

        updatedBal.textContent = balance.toFixed(2);
        updatedInc.textContent = totalIncome.toFixed(2);
        updatedExp.textContent = totalExpenses.toFixed(2);
    }

    window.editExpense = function(index) {
        const expense = expenses[index];
        document.getElementById('expense-name').value = expense.name;
        document.getElementById('expense-amount').value = expense.amount;
        document.getElementById('expense-date').value = expense.date;
        document.getElementById('expense-category').value = expense.category;
        document.getElementById('itemType').value = expense.type;
        expenses.splice(index, 1);
        localStorage.setItem('expenses', JSON.stringify(expenses));
        renderExpenses();
        updateSummary();
    };

    window.deleteExpense = async function(index) {
        const expenseId = expenseList.rows[index].getAttribute('data-id');
        try {
            const response = await fetch(`http://localhost:5000/expenses/${expenseId}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                fetchExpenses();
            } else {
                alert('Failed to delete expense');
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    };

    window.logout = function() {
        currentUser = null;
        localStorage.removeItem('currentUser');
        tracker.style.display = 'none';
        loginContainer.style.display = 'block';
    };
});
