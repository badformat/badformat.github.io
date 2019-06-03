(require 'ox-publish)
(setq org-publish-project-alist
      '(("site"
         :base-directory "./"
	 :publishing-directory "./"
         :section-numbers nil
         :with-toc nil
	 :with-author nil
	 :with-timestamps nil
	 :with-title t
	 :recursive t
	 :publishing-function org-html-publish-to-html
	 :html-html5-fancy t
	 :html-validation-link nil
	 :html-doctype "html5"
	 :html-postamble nil
	 :auto-sitemap t
         :style "<link rel=\"stylesheet\"
                href=\"./css/style.css\"
                type=\"text/css\"/>")))
