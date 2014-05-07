(function ($) {

    $(document).bind('flagGlobalAfterLinkUpdate', function(event, data) {
        var node = $("#node-" + data.contentId);
        node.toggleClass("attending", data.flagStatus == 'flagged');

        var participants = node.find(".field-name-field-participants > .field-items");

        var count = node.find(".participants-count").text();
        if (data.flagStatus == 'unflagged') {
            participants.find(".field-item").filter(function() {
                return $(this).text() === Drupal.settings.luz.user_name;
            }).remove();
            count--;
        }
        else if (data.flagStatus == 'flagged') {
            participants.find(".no-attendees").parent().remove();

            var item = '<div class="field-item">' + Drupal.settings.luz.user_name + "</div>";
            participants.append(item);
            count++;
        }

        node.find(".participants-count").text(count);
    });


    $(document).ready(function() {
       $("#navbar .primary-nav a").click(function(event) {
           event.preventDefault();

           var link = $(event.currentTarget);
           $("#navbar .primary-nav .active").removeClass("active");
           link.addClass("active").parent().addClass("active");
           $("#luz-wrapper").removeClass("week-0 week-1 week-2 week-3").addClass("week-" + link.data('week'));
       });
    });
})(jQuery);
