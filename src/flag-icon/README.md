```jsx
<div>
    {['error', 'fail', 'ok', 'ok_filled', 'calendar', 'search', 'close', 'user'].map(icon => (
        <div className='row' >
            {['s', 'm', 'l', 'xl', 'xxl'].map(size => (
                <div className='column l' >
                    <Icon
                        size={ size }
                        icon={ icon }
                    />
                </div>
            ))}
        </div>
    ))}
</div>
